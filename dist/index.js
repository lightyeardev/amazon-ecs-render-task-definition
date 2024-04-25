/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 152:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const path = __nccwpck_require__(17);
const core = __nccwpck_require__(57);
const tmp = __nccwpck_require__(862);
const fs = __nccwpck_require__(147);

async function run() {
  try {
    // Get inputs
    const taskDefinitionFile = core.getInput('task-definition', { required: true });
    const containerName = core.getInput('container-name', { required: true });
    const imageURI = core.getInput('image', { required: true });

    const environmentVariables = core.getInput('environment-variables', { required: false });
    const tags = core.getInput('tags', { required: false });

    const logConfigurationLogDriver = core.getInput("log-configuration-log-driver", { required: false });
    const logConfigurationOptions = core.getInput("log-configuration-options", { required: false });
    const dockerLabels = core.getInput('docker-labels', { required: false });
    const command = core.getInput('command', { required: false });

    // Parse the task definition
    const taskDefPath = path.isAbsolute(taskDefinitionFile) ?
      taskDefinitionFile :
      path.join(process.env.GITHUB_WORKSPACE, taskDefinitionFile);
    if (!fs.existsSync(taskDefPath)) {
      throw new Error(`Task definition file does not exist: ${taskDefinitionFile}`);
    }
    const taskDefContents = require(taskDefPath);

    // Insert the image URI
    if (!Array.isArray(taskDefContents.containerDefinitions)) {
      throw new Error('Invalid task definition format: containerDefinitions section is not present or is not an array');
    }
    const containerDef = taskDefContents.containerDefinitions.find(function (element) {
      return element.name == containerName;
    });
    if (!containerDef) {
      throw new Error('Invalid task definition: Could not find container definition with matching name');
    }
    containerDef.image = imageURI;

    if (command) {
      containerDef.command = command.split(' ')
    }

    if (environmentVariables) {

      // If environment array is missing, create it
      if (!Array.isArray(containerDef.environment)) {
        containerDef.environment = [];
      }

      // Get pairs by splitting on newlines
      environmentVariables.split('\n').forEach(function (line) {
        // Trim whitespace
        const trimmedLine = line.trim();
        // Skip if empty
        if (trimmedLine.length === 0) { return; }
        // Split on =
        const separatorIdx = trimmedLine.indexOf("=");
        // If there's nowhere to split
        if (separatorIdx === -1) {
          throw new Error(`Cannot parse the environment variable '${trimmedLine}'. Environment variable pairs must be of the form NAME=value.`);
        }
        // Build object
        const variable = {
          name: trimmedLine.substring(0, separatorIdx),
          value: trimmedLine.substring(separatorIdx + 1),
        };

        // Search container definition environment for one matching name
        const variableDef = containerDef.environment.find((e) => e.name == variable.name);
        if (variableDef) {
          // If found, update
          variableDef.value = variable.value;
        } else {
          // Else, create
          containerDef.environment.push(variable);
        }
      })
    }

    if (tags) {
      // If tags array is missing, create it
      if (!Array.isArray(containerDef.tags)) {
        containerDef.tags = [];
      }

      // Get pairs by splitting on newlines
      tags.split('\n').forEach(function (line) {
        // Trim whitespace
        const trimmedLine = line.trim();
        // Skip if empty
        if (trimmedLine.length === 0) { return; }
        // Split on =
        const separatorIdx = trimmedLine.indexOf("=");
        // If there's nowhere to split
        if (separatorIdx === -1) {
          throw new Error(`Cannot parse the tag '${trimmedLine}'. Tag key–value pairs must be of the form KEY=value.`);
        }
        // Build object
        const tag = {
          key: trimmedLine.substring(0, separatorIdx),
          value: trimmedLine.substring(separatorIdx + 1),
        };

        // Search container definition tags for one matching name
        const tagDef = containerDef.tags.find((e) => e.key === tag.key);
        if (tagDef) {
          // If found, update
          tagDef.value = tag.value;
        } else {
          // Else, create
          containerDef.tags.push(tag);
        }
      });
    }

    if (logConfigurationLogDriver) {
      if (!containerDef.logConfiguration) { containerDef.logConfiguration = {} }
      const validDrivers = ["json-file", "syslog", "journald", "logentries", "gelf", "fluentd", "awslogs", "splunk", "awsfirelens"];
      if (!validDrivers.includes(logConfigurationLogDriver)) {
        throw new Error(`'${logConfigurationLogDriver}' is invalid logConfigurationLogDriver. valid options are ${validDrivers}. More details: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_LogConfiguration.html`)
      }
      containerDef.logConfiguration.logDriver = logConfigurationLogDriver
    }

    if (logConfigurationOptions) {
      if (!containerDef.logConfiguration) { containerDef.logConfiguration = {} }
      if (!containerDef.logConfiguration.options) { containerDef.logConfiguration.options = {} }
      logConfigurationOptions.split("\n").forEach(function (option) {
        option = option.trim();
        if (option && option.length) { // not a blank line
          if (option.indexOf("=") == -1) {
            throw new Error(`Can't parse logConfiguration option ${option}. Must be in key=value format, one per line`);
          }
          const [key, value] = option.split("=");
          containerDef.logConfiguration.options[key] = value
        }
      })
    }

    if (dockerLabels) {
      // If dockerLabels object is missing, create it
      if (!containerDef.dockerLabels) { containerDef.dockerLabels = {} }

      // Get pairs by splitting on newlines
      dockerLabels.split('\n').forEach(function (label) {
        // Trim whitespace
        label = label.trim();
        if (label && label.length) {
          if (label.indexOf("=") == -1 ) {
            throw new Error(`Can't parse logConfiguration option ${label}. Must be in key=value format, one per line`);
          }
          const [key, value] = label.split("=");
          containerDef.dockerLabels[key] = value;
        }
      })
    }

    // Write out a new task definition file
    var updatedTaskDefFile = tmp.fileSync({
      tmpdir: process.env.RUNNER_TEMP,
      prefix: 'task-definition-',
      postfix: '.json',
      keep: true,
      discardDescriptor: true
    });
    const newTaskDefContents = JSON.stringify(taskDefContents, null, 2);
    fs.writeFileSync(updatedTaskDefFile.name, newTaskDefContents);
    core.setOutput('task-definition', updatedTaskDefFile.name);
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === require.cache[eval('__filename')]) {
  run();
}


/***/ }),

/***/ 57:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 862:
/***/ ((module) => {

module.exports = eval("require")("tmp");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(152);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;