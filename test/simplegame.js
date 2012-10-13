// Requires jQuery.

SimpleGame = function(parentContainer, randomCharFunc, options) {
  options = options || {};
  this._parent_container = $(parentContainer);
  this._random_char_func = randomCharFunc;

  this._running = false;
  this._num_questions = 0;
  this._num_correct = 0;

  this._max_char_millis = options["charTimeout"] || 3000;
  // TODO: make this configurable
  this._max_char_millis = 3000;

  this.correct_color = "#2e2";
  this.wrong_color = "#e22";
  this.neutral_color = "#ee2";

  this.initContainer(this._parent_container);
};

SimpleGame.prototype.running = function() { return this._running; }

SimpleGame.prototype.initContainer = function(container) {
  // Initialize the container.
  container.empty();
  $("<div/>", {
      text: "Start?",
      id: "div_question",
      class: "neutral",
      css: {
          height: "50%",
          position: "relative",
          "font-size": "4em",
      },
  }).appendTo(container);
  $("<div/>", {
      text: "",
      id: "div_result",
      class: "neutral",
      css: {
          height: "40%",
          position: "relative",
          "font-size": "4em",
      },
  }).appendTo(container);
  $("<div/>", {
      text: "",
      id: "div_stats",
      class: "stats",
      css: {
          height: "10%",
          position: "relative",
          "font-size": "1em",
          "border-top": "1px black solid",
          "border-bottom": "1px black solid",
      },
  }).appendTo(container);
  $("<span/>", {
      text: "",
      id: "span_score",
      css: {
          width: "50%",
          height: "100%",
          display: "inline-block",
          position: "static",
      },
  }).appendTo($("#div_stats"));
  $("<span/>", {
      text: "",
      id: "span_time",
      css: {
          width: "50%",
          height: "100%",
          display: "inline-block",
          position: "static",
      },
  }).appendTo($("#div_stats"));
};

SimpleGame.prototype.start = function() {
  if (this._running) {
    throw "Cannot start a running instance.";
  }
  this._running = true;
  this._current_char = null;
  this._start_time = new Date().getTime();  // milliseconds

  this._stats_interval = setInterval(
      $.proxy(this._displayStats, this), 200);

  this._doCountdown(this._doCharCycle);
};

SimpleGame.prototype.stop = function() {
  if (!this._running) {
    throw "Cannot stop a stopped instance.";
  }
  this._running = false;
  clearInterval(this._stats_interval);
  this.initContainer(this._parent_container);
};

SimpleGame.prototype._zeroPad = function(num, minPlaces) {
  var zero = minPlaces - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
};

SimpleGame.prototype._displayStats = function() {
  if (!this._running) {
    return;
  }
  var elapsed_time = new Date().getTime() - this._start_time;

  var elapsed_seconds = this._zeroPad(
      Math.floor(elapsed_time / 1000) % 60, 2);
  var elapsed_minutes = this._zeroPad(
      Math.floor(elapsed_time / 60000) % 60, 2);

  var elapsed_str = elapsed_minutes + ":" + elapsed_seconds;

  $("#span_score").text(this._num_correct + " / " + this._num_questions);
  $("#span_time").text(elapsed_str);
}

SimpleGame.prototype._doCountdown = function(finishedCallback) {
  if (!this._running) {
    return;
  }
  var starting_countdown = 3;
  var qdiv = $("#div_question");
  qdiv.text("Ready?");

  var onCountdown = function() {
    if (!this._running) {
      return;
    }
    if (starting_countdown == 0) {
      qdiv.text("Go!");
      setTimeout($.proxy(finishedCallback, this), 1000);
      return;
    }
    qdiv.text(starting_countdown);
    --starting_countdown;
    setTimeout($.proxy(onCountdown, this), 1000);
  }

  setTimeout($.proxy(onCountdown, this), 1000);
};

SimpleGame.prototype._doCharCycle = function() {
  this._current_char = this._random_char_func();
  this._num_questions += 1;

  $("#div_result").
    removeClass("wrong correct").
    addClass("neutral").
    text("");

  $("#div_question").text(this._current_char);

  this._question_timer = setTimeout(
      $.proxy(this.answerAttempt, this),
      this._max_char_millis);
};

SimpleGame.prototype.answerAttempt = function(character) {
  if (!this._running || this._current_char == null) {
    return;
  }
  clearTimeout(this._question_timer);
  var target = this._current_char;
  this._current_char = null;  // Make sure later keys don't get accepted.

  if (character == undefined || character == null) {
    $("#div_result").
      removeClass("neutral correct").
      addClass("wrong").
      text("time!");
  } else if (character == target) {
    $("#div_result").
      removeClass("neutral wrong").
      addClass("correct").
      text("Yes!");
    this._num_correct += 1;
  } else {
    $("#div_result").
      removeClass("neutral correct").
      addClass("wrong").
      text("oops: " + character);
  }

  setTimeout($.proxy(this._doCharCycle, this), 800);
};

