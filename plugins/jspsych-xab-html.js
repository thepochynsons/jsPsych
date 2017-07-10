/*  jspsych-xab.js
 *	Josh de Leeuw
 *
 *  This plugin runs a single XAB trial, where X is an image presented in isolation, and A and B are choices, with A or B being equal to X.
 *	The subject's goal is to identify whether A or B is identical to X.
 *
 * documentation: docs.jspsych.org
 *
 */

jsPsych.plugins['xab-html'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'xab-html',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.IMAGE,
        array: true,
        default: undefined,
        no_function: false,
        description: ''
      },
      left_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        default: 'q',
        no_function: false,
        description: ''
      },
      right_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        default: 'p',
        no_function: false,
        description: ''
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
        no_function: false,
        description: ''
      },
      x_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: 1000,
        no_function: false,
        description: ''
      },
      x_durationab_gap: {
        type: jsPsych.plugins.parameterType.INT,
        default: 1000,
        no_function: false,
        description: ''
      },
      ab_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: -1,
        no_function: false,
        description: ''
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: -1,
        no_function: false,
        description: ''
      }
    }
  }

  plugin.trial = function(display_element, trial) {

    // default trial values
    trial.left_key = trial.left_key || 81; // defaults to 'q'
    trial.right_key = trial.right_key || 80; // defaults to 'p'
    trial.x_duration = trial.x_duration || 1000; // defaults to 1000msec.
    trial.x_durationab_gap = trial.x_durationab_gap || 1000; // defaults to 1000msec.
    trial.ab_duration = trial.ab_duration || -1; // defaults to -1, meaning infinite time on AB. If a positive number is used, then AB will only be displayed for that length.
    trial.trial_duration = trial.trial_duration || -1; //
    trial.prompt = (typeof trial.prompt === 'undefined') ? "" : trial.prompt;

    // unpack the stimuli array
    trial.x_path = trial.stimuli[0];

    // if there is only a pair of stimuli, then the first is the target and is shown twice.
    // if there is a triplet, then the first is X, the second is the target, and the third is foil (useful for non-exact-match XAB).
    if (trial.stimuli.length == 2) {
      trial.a_path = trial.stimuli[0];
      trial.b_path = trial.stimuli[1];
    } else {
      trial.a_path = trial.stimuli[1];
      trial.b_path = trial.stimuli[2];
    }

    // how we display the content depends on whether the content is
    // HTML code or an image path.

    display_element.innerHTML = '<div class="jspsych-xab-stimulus" >'+trial.x_path+'</div>';


    // start a timer of length trial.x_duration to move to the next part of the trial
    jsPsych.pluginAPI.setTimeout(function() {
      showBlankScreen();
    }, trial.x_duration);


    function showBlankScreen() {
      // remove the x stimulus
      display_element.innerHTML = '';

      // start timer
      jsPsych.pluginAPI.setTimeout(function() {
        showSecondStimulus();
      }, trial.x_durationab_gap);
    }


    function showSecondStimulus() {

      // randomize whether the target is on the left or the right
      var images = [trial.a_path, trial.b_path];
      var target_left = (Math.floor(Math.random() * 2) === 0); // 50% chance target is on left.
      if (!target_left) {
        images = [trial.b_path, trial.a_path];
      }

      // show the options
      display_element.innerHTML += '<div class="jspsych-xab-stimulus left">'+images[0]+'</div>';
      display_element.innerHTML += '<div class="jspsych-xab-stimulus right">'+images[1]+'</div>';


      if (trial.prompt !== "") {
        display_element.innerHTML += trial.prompt;
      }

      // if ab_duration is > 0, then we hide the stimuli after ab_duration milliseconds
      if (trial.ab_duration > 0) {
        jsPsych.pluginAPI.setTimeout(function() {
          var matches = display_element.querySelectorAll('.jspsych-xab-stimulus');
          for(var i=0; i<matches.length; i++){
            matches[i].style.visibility = 'hidden';
          }
        }, trial.ab_duration);
      }

      // if trial_duration > 0, then we end the trial after trial_duration milliseconds
      if (trial.trial_duration > 0) {
        jsPsych.pluginAPI.setTimeout(function() {
          end_trial({
            rt: -1,
            correct: false,
            key: -1
          });
        }, trial.trial_duration);
      }

      // create the function that triggers when a key is pressed.
      var after_response = function(info) {

        var correct = false; // true when the correct response is chosen

        if (info.key == trial.left_key) // 'q' key by default
        {
          if (target_left) {
            correct = true;
          }
        } else if (info.key == trial.right_key) // 'p' key by default
        {
          if (!target_left) {
            correct = true;
          }
        }

        info.correct = correct;

        end_trial(info);

      };

      var end_trial = function(info) {
        // kill any remaining setTimeout handlers
        jsPsych.pluginAPI.clearAllTimeouts();

        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);

        // create object to store data from trial
        var trial_data = {
          "rt": info.rt,
          "correct": info.correct,
          "stimulus": JSON.stringify([trial.x_path, trial.a_path, trial.b_path]),
          "key_press": info.key
        };

        display_element.innerHTML = ''; // remove all

        jsPsych.finishTrial(trial_data);
      }

      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: [trial.left_key, trial.right_key],
        rt_method: 'date',
        persist: false,
        allow_held_key: false
      });
    }
  };

  return plugin;
})();
