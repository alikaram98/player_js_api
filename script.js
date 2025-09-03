"use strict";

const media = document.getElementById("media");

const wrapper = document.getElementById("wrapper");
const controls = document.getElementById("controls");

const playPauseBtn = document.getElementById("play-pause");
const stopBtn = document.getElementById("stop");
const pipBtn = document.getElementById("pip");
const fullscreenBtn = document.getElementById("fullscreen");
const muteBtn = document.getElementById("mute");
const subTitleBtn = document.getElementById("subTitle");

const speedBar = document.getElementById("speed-bar");
const progressBar = document.getElementById("progress-bar");
const previewImage = document.getElementById("previewImage");
const volumeBar = document.getElementById("volume-bar");

const mediaTime = document.getElementById("media-time");

const imgPlayPause = playPauseBtn.firstElementChild;
const imgStop = stopBtn.firstElementChild;
const imgPip = pipBtn.firstElementChild;
const imgFullScreen = fullscreenBtn.firstElementChild;
const imgMute = muteBtn.firstElementChild;
const imgSubTitle = subTitleBtn.firstElementChild;

let timerFullScreen = [];

let lastVolume = 100;

let lastPlayState = false;

let showControlsTimer = null;

let mouseOnControlers = false;

let track = null;

/////////////////////////
//  Reset all buttons  //
/////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  imgPlayPause.src = playIcon;
  imgStop.src = stopIcon;
  imgPip.src = pipIcon;
  imgMute.src = volumeIcon;
  imgFullScreen.src = fullscreenIcon;
  imgSubTitle.src = subtitleIcon;

  volumeBar.value = 100;
  speedBar.value = 1;
  progressBar.value = 0;

  stopBtn.style.display = "none";

  if (!document.pictureInPictureEnabled) {
    pipBtn.style.display = "none";
  }

  if (!document.fullscreenEnabled) {
    fullscreenBtn.style.display = "none";
  }
});

/////////////////////////////////////////////
//  Check if can play video change number  //
/////////////////////////////////////////////
media.addEventListener("canplay", function () {
  setTimeout(() => {
    mediaTime.innerHTML =
      convertTime(media.currentTime) + "/" + convertTime(media.duration);
  }, 120);
});

////////////////////////////////////////////////////////
//  Play or Pause video and change icon by condition  //
////////////////////////////////////////////////////////
playPauseBtn.addEventListener("click", playPauseVideo);
media.addEventListener("click", () => {
  let timer = setTimeout(() => {
    playPauseVideo();
  }, 500);
  timerFullScreen.push(timer);
});

function playPauseVideo() {
  if (media.paused) {
    media.play();

    lastPlayState = true;

    imgPlayPause.src = pauseIcon;
  } else {
    media.pause();
    lastPlayState = false;
    imgPlayPause.src = playIcon;
  }
}

////////////////////////////////////////////////////////
//  Update Progres bar when timeupdate event is fire  //
////////////////////////////////////////////////////////
media.addEventListener("timeupdate", function () {
  let percent = (media.currentTime / media.duration) * 100;
  progressBar.value = percent.toFixed();
  mediaTime.innerHTML =
    convertTime(media.currentTime) + "/" + convertTime(media.duration);

  if (
    convertTime(media.currentTime) === "00:00:00" ||
    convertTime(media.currentTime) == "00:00"
  ) {
    stopBtn.style.display = "none";
  } else {
    stopBtn.style.display = "inline-block";
  }
});

//////////////////////////////////////////////////
//  Update current time when move progress bar  //
//////////////////////////////////////////////////
progressBar.addEventListener("input", function () {
  media.currentTime = (progressBar.value * media.duration) / 100;
});

///////////////////
//  Update time  //
///////////////////
function convertTime(second) {
  second *= 1000; // convert second to millisecond

  if (second > 36e5) {
    return new Date(second).toISOString().substr(11, 8);
  } else {
    return new Date(second).toISOString().substr(14, 5);
  }
}

/////////////////////////
//  Config stop video  //
/////////////////////////
stopBtn.addEventListener("click", function () {
  media.pause();
  media.currentTime = 0;
  imgPlayPause.src = playIcon;
});

//////////////////////////
//  Config speed video  //
//////////////////////////
speedBar.addEventListener("input", function () {
  media.playbackRate = speedBar.value;
});

/////////////////////////////////
//  Config picture in picture  //
/////////////////////////////////
pipBtn.addEventListener("click", async function () {
  if (document.pictureInPictureEnabled) {
    if (!document.pictureInPictureElement) {
      media.requestPictureInPicture();
    } else {
      media.exitPictureInPicture();
    }
  }
});

media.addEventListener("pause", () => (imgPlayPause.src = playIcon));

///////////////////////////////
//  Config fullscreen video  //
///////////////////////////////
fullscreenBtn.addEventListener("click", fullScreenVideo);
media.addEventListener("dblclick", fullScreenVideo);

function fullScreenVideo() {
  if (timerFullScreen.length > 0) {
    for (const timer of timerFullScreen) {
      clearTimeout(timer);
    }
  }

  if (document.fullscreenEnabled) {
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
}

///////////////////////////
//  Volume video config  //
///////////////////////////
volumeBar.addEventListener("input", function () {
  media.volume = volumeBar.value / 100;

  if (media.volume === 0) {
    imgMute.src = mutedIcon;
  } else {
    imgMute.src = volumeIcon;
    lastVolume = media.volume;
  }
});

muteBtn.addEventListener("click", function () {
  if (!media.muted) {
    media.muted = true;

    volumeBar.value = 0;

    imgMute.src = mutedIcon;
  } else {
    media.muted = false;

    volumeBar.value = lastVolume * 100;

    imgMute.src = volumeIcon;
  }
});

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    media.pause();
  } else {
    console.log(lastPlayState);
    if (lastPlayState) {
      media.play();
    }
  }
});

wrapper.addEventListener("mousemove", function () {
  if (showControlsTimer) {
    clearTimeout(showControlsTimer);
  }
  showControlsTimer = setTimeout(() => {
    if (!media.paused && !mouseOnControlers) {
      controls.style.display = "none";
    }
  }, 2000);

  controls.style.display = "block";
});

controls.addEventListener("mouseenter", () => (mouseOnControlers = true));
controls.addEventListener("mouseleave", () => (mouseOnControlers = false));

//////////////////////////////////
//  Config show subtitle video  //
//////////////////////////////////
subTitleBtn.addEventListener("click", function () {
  this.classList.toggle("buttonActive");

  if (this.classList.contains("buttonActive")) {
    if (!track) {
      track = media.addTextTrack("subtitles", "Custom Subtitles", "en");

      track.mode = "showing"; // خیلی مهم: باید showing باشه

      fetch("subtitle.vtt")
        .then((res) => res.text())
        .then((vttData) => {
          const lines = vttData.split("\n");

          let start = null,
            end = null,
            text = "";

          for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            if (line.includes("-->")) {
              const times = line.split("-->");
              start = parseTime(times[0].trim());
              end = parseTime(times[1].trim());
            } else if (start !== null && end !== null) {
              text = line;
              if (Number.isNaN(end) && Number.isNaN(start)) {
                continue;
              }
              if (Number.isNaN(start)) {
                start = end;
              }
              if (Number.isNaN(end)) {
                end = start;
              }
              track.addCue(new VTTCue(start, end, text));
              start = end = null;
              text = "";
            }
          }
        });
    } else {
      track.mode = "showing";
    }
  } else {
    if (track) {
      track.mode = "disabled";
    }
  }
});
function parseTime(timeString) {
  const [hms, ms] = timeString.split(".");
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s + (ms ? Number("0." + ms) : 0);
}

/////////////////////////////////////////////
//  Config Image preview with progressbar  //
/////////////////////////////////////////////
const thumbnailInterval = 10; // چند ثانیه یک بار فریم برداری شده
progressBar.addEventListener("mousemove", function (e) {
  previewImage.style.display = "block";
  const rect = progressBar.getBoundingClientRect();
  const position = (e.clientX - rect.left) / rect.width; // نسبت موقعیت ماوس (۰ تا ۱)
  const videoDuration = media.duration; // طول ویدیو
  const currentTime = position * videoDuration; // زمان فعلی بر اساس موقعیت ماوس

  // پیدا کردن نزدیک‌ترین تصویر پیش‌نمایش
  const thumbnailIndex = Math.floor(currentTime / thumbnailInterval) + 1;
  const thumbnailFile = `images/output_${thumbnailIndex}.jpg`;
  // تنظیم تصویر پیش‌نمایش
  previewImage.src = thumbnailFile;
  previewImage.style.display = "block";

  // تنظیم موقعیت تصویر پیش‌نمایش
  const previewWidth = previewImage.offsetWidth;
  let left = e.clientX - rect.left - previewWidth / 2; // وسط تصویر روی ماوس
  // جلوگیری از خروج تصویر از کادر
  left = Math.max(0, Math.min(left, rect.width - previewWidth));
  previewImage.style.left = `${left}px`;
});
progressBar.addEventListener("mouseout", () => {
  // مخفی کردن تصویر وقتی ماوس خارج می‌شود
  previewImage.style.display = "none";
});
