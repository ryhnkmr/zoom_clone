// const { Stream } = require("stream");

// const { text } = require("body-parser");

// const { PeerServer } = require("peer");

// const { Socket } = require("dgram");

  const socket = io('/')
  const videoGrid = document.getElementById('video-grid')
  const myVideo = document.createElement('video');
  let userHands = []
  let totalClients
  myVideo.muted = true;
  let userId

// Deployはポート番号:443、ローカルは3030

  var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '3030'
  });

  let myVideoStream;
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on('call', call => {
      call.answer(stream);
      const video = document.createElement('video');
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
      })
    })

    socket.on('user-connected', (userId, Clients) => {
      connectToNewUser(userId, stream);
      localStorage.setItem('userId', userId);
      totalClients = Clients;
    })

    // テキストの作成
    let text = $('input')
    $('html').keydown((e) => {
      if(e.which == 13 && text.val().length !== 0) {
        socket.emit('message', text.val());
        text.val('');
      }
    })
    
    socket.on('createMessage', message => {
      $('.messages').append(`<li class="message"><b>user</b></br>${message}</li>`)
    })

    // じゃんけんの機能 Userの選択した手を送信する
    $('#gu').on('click', () => {
      debugger
      $('#your_hand').append('<i class="far fa-hand-rock selected_hand" id="gu_selected"></i>');
      socket.emit('sendHand', 1, getUserId())
      $('.choose_hands').css('display', 'none')
      // ToDo: 選択したら結果が出るまで選択できないようにする、何を選択したのかは分かる状態に
    })
    $('#cho').on('click', () => {
      $('#your_hand').append('<i class="far fa-hand-peace selected_hand" id="cho_selected"></i>');
      socket.emit('sendHand', 2, getUserId())
      $('.choose_hands').css('display', 'none')
    })
    $('#pa').on('click', () => {
      $('#your_hand').append('<i class="far fa-hand-paper selected_hand" id="pa_selected"></i>');
      socket.emit('sendHand', 3, getUserId())
      $('.choose_hands').css('display', 'none')
    })

    // userIDと手を含んだHashを受け取る
    socket.on('prepareHands', (userHand) => {
      userHands.push(userHand);
      // 後に選択したUserしか結果が表示されないのでもう一度サーバーに投げる
      if (userHands.length == totalClients && totalClients > 1) {
        socket.emit('readyResult', userHands)
      }
    })

    socket.on('showResult', () => {
      // ここで判定をする
      // 1: グー、2: チョキ、3: パー
      debugger;
      if (userHands.every(hand => hand.choice == 1)) {
        // あいこ
        $('#result_text').text('Tie...');
        return setTimeout(resetStyle, 3000);
      } 

      if (userHands.every(hand => hand.choice == 2)) {
        // あいこ
        $('#result_text').text('Tie...');
        return setTimeout(resetStyle, 3000);
      } 

      if (userHands.every(hand => hand.choice == 3)) {
        // あいこ
        $('#result_text').text('Tie...');
        return setTimeout(resetStyle, 3000);
      } 
      
      
      if (userHands.every(hand => hand.choice == 1 || hand.choice == 2)) {
        // 1を選んだユーザーの勝ち
        if ($('#gu_selected').length > 0) {
          $('#result_text').text('You Win!');
        } else {
          $('#result_text').text('You Lose...');
        }
        return setTimeout(resetStyle,3000);
      } 
      
      if (userHands.every(hand => hand.choice == 2 || hand.choice == 3)) {
        // 2を選んだユーザーの勝ち
        console.log('チョキ、パー')
        if ($('#cho_selected').length > 0) {
          $('#result_text').text('You Win!');
        } else {
          $('#result_text').text('You Lose...');
        }
        return setTimeout(resetStyle,3000);
      }
      
      if (userHands.every(hand => hand.choice == 1 || hand.choice == 3)) {
        // 3を選んだユーザーの勝ち
        console.log('グー、パー')
        if ($('#pa_selected').length > 0) {
          $('#result_text').text('You Win!');
        } else {
          $('#result_text').text('You Lose...');
        }
        return setTimeout(resetStyle,3000);
      } else {
        // あいこ
        $('#result_text').text('Tie...'); 
        return setTimeout(resetStyle,3000);
      }
    })
  })

  peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
    userId = id;
  })


  const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream)
    const video = document.createElement('video');
    const divForUserId = document.createElement('video');
    video.append(divForUserId);
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  }

  const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    })
    videoGrid.append(video)
  }

  function getUserId() {
    const id = localStorage.getItem('userId');
    return id
  }

  // リセットする(手を再選択できるように、結果のテキストを非表示に、選んだ手の表示をなくす)
  function resetStyle() {
    $('.choose_hands').removeAttr('style');
    $('#result_text').text('');
    $('.selected_hand').remove();
    userHands = [];
  }

  const scrollToBotton = () => {
    let d = $('.main__chat_window');
    d.scrollTop(d.prop('scrollHeight'));
  }

  // 音声のミュート関連
  const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
  }

  const setMuteButton = () => {
    const html = `
      <i class="fas fa-microphone"></i>
      <span>Mute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
  }

  // カメラを止めるかどうか
  const setUnmuteButton = () => {
    const html = `
      <i class="unmute fas fa-microphone-slash"></i>
      <span>Unmute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
  }

  const playStop = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      setPlayVideo();
    } else {
      setStopVideo();
      myVideoStream.getVideoTracks()[0].enabled = true;
    }
  }

  const setStopVideo = () => {
    const html = `
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
  }

  const setPlayVideo = () => {
    const html = `
      <i class="fas fa-video-slash"></i>
      <span>Play Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
  }