'use strict';

function last(array) {
    return array[array.length - 1];
}

if (!window.vkpcInjected) {
    const INFO_ARTIST = 4;
    const INFO_TITLE = 3;
    const INFO_LENGTH = 5;
    const INFO_ART_URL = 14;

    const sendUpdateEvent = (type) => {
        const audioObject = window.ap._currentAudio;
        const {currentTime} = window.ap._impl._currentAudioEl || {};
        window.postMessage({
            sender: 'vkpc-player',
            type,
            trackInfo: {
                artist: audioObject[INFO_ARTIST],
                title: audioObject[INFO_TITLE],
                length: audioObject[INFO_LENGTH] * 1000,
                'art-url': last(audioObject[INFO_ART_URL].split(','))
            },
            currentTime: (currentTime || 0) * 1000,
        }, '*');
    };

    window.addEventListener('message', (event) => {
        if (event.data.sender !== 'vkpc-proxy') {
            return;
        }
        let audioElement = window.ap._impl._currentAudioEl;
        switch (event.data.command) {
        case 'play':
            window.ap.play();
            break;
        case 'pause':
            window.ap.pause();
            break;
        case 'play-pause':
            if (window.ap.isPlaying()) {
                window.ap.pause();
            } else {
                window.ap.play();
            }
            break;
        case 'next':
            window.ap.playNext();
            break;
        case 'previous':
            window.ap.playPrev();
            break;
        case 'stop':
            window.ap.stop();
            break;
        case 'seek':
            audioElement.currentTime += event.data.argument / 1000;
            break;
        case 'set-position':
            audioElement.currentTime = event.data.argument / 1000;
            break;
        case 'reconnect':
            if (window.ap.isPlaying()) {
                sendUpdateEvent('start');
            } else {
                sendUpdateEvent('pause');
            }
            break;
        }
    });

    for (let event of ['start', 'pause', 'stop']) {
        window.ap.subscribers.push({
            et: event,
            cb: sendUpdateEvent.bind(null, event),
        });
    }
    window.ap.subscribers.push({
        et: 'progress',
        cb: _.throttle(sendUpdateEvent.bind(null, 'progress'), 1000),
    });
    window.vkpcInjected = true;
}
