'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var fs = require('fs');
var path = require('path');

// custom variable matches
var propertyMatch = /^--([_a-zA-Z]+[_a-zA-Z0-9-]*)$/;
var propertySetMatch = /^--([_a-zA-Z]+[_a-zA-Z0-9-]*):$/;
var mediaQueryMatch = /^--([_a-zA-Z]+[_a-zA-Z0-9-]*)\s+(.+)$/;
var selectorMatch = /^:--([_a-zA-Z]+[_a-zA-Z0-9-]*)\s+(.+)$/;

// plugin
module.exports = require('postcss').plugin('postcss-extract-variable-scheme', function () {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var options = {
    dest: 'build/variables/',
    fileExports: [{
      prefixes: ['fs', 'lh'],
      filename: 'typography'
    }]
  };

  Object.assign(options, config);

  // Variable detection functions
  function isCustomMediaQuery(node, prefixes) {
    var reMatch = false;
    for (var l = 0; l < prefixes.length; l++) {
      var prefix = prefixes[l];
      var regexp = new RegExp('^--' + prefix + '-([_a-zA-Z]+[_a-zA-Z0-9-]*)\\s+(.+)$');

      if (regexp.test(node.params)) {
        reMatch = true;
        break;
      }
    }

    return node.type === 'atrule' && node.name === 'custom-media' && reMatch;
  }

  function isCustomProperty(node, prefixes) {
    var reMatch = false;
    for (var l = 0; l < prefixes.length; l++) {
      var prefix = prefixes[l];
      var regexp = new RegExp('^--' + prefix + '-([_a-zA-Z]+[_a-zA-Z0-9-]*)$');

      if (regexp.test(node.prop)) {
        reMatch = true;
        break;
      }
    }

    return node.type === 'decl' && reMatch;
  }

  function isCustomPropertySet(node, prefixes) {
    var reMatch = false;
    for (var l = 0; l < prefixes.length; l++) {
      var prefix = prefixes[l];
      var regexp = new RegExp('^--' + prefix + '-([_a-zA-Z]+[_a-zA-Z0-9-]*):$');

      if (regexp.test(node.selector)) {
        reMatch = true;
        break;
      }
    }

    return node.type === 'rule' && reMatch;
  }

  function isCustomSelector(node, prefixes) {
    var reMatch = false;
    for (var l = 0; l < prefixes.length; l++) {
      var prefix = prefixes[l];
      var regexp = new RegExp('^:--' + prefix + '-([_a-zA-Z]+[_a-zA-Z0-9-]*)\\s+(.+)$');

      if (regexp.test(node.params)) {
        reMatch = true;
        break;
      }
    }

    return node.type === 'atrule' && node.name === 'custom-selector' && reMatch;
  }

  return function (root) {
    var outputFiles = {};

    root.walk(function (node) {
      for (var i = 0; i < options.fileExports.length; i++) {
        var exporter = options.fileExports[i];
        outputFiles[exporter.filename] = outputFiles[exporter.filename] || {};

        if (isCustomMediaQuery(node, exporter.prefixes)) {
          var _node$params$match = node.params.match(mediaQueryMatch),
              _node$params$match2 = _slicedToArray(_node$params$match, 3),
              property = _node$params$match2[1],
              value = _node$params$match2[2];

          Object.assign(outputFiles[exporter.filename], propertyAssigner(property, value, node));
        } else if (isCustomProperty(node, exporter.prefixes)) {
          var _node$prop$match = node.prop.match(propertyMatch),
              _node$prop$match2 = _slicedToArray(_node$prop$match, 2),
              _property = _node$prop$match2[1];

          Object.assign(outputFiles[exporter.filename], propertyAssigner(_property, node.value, node));
        } else if (isCustomPropertySet(node, exporter.prefixes)) {
          var _node$selector$match = node.selector.match(propertySetMatch),
              _node$selector$match2 = _slicedToArray(_node$selector$match, 2),
              _property2 = _node$selector$match2[1];

          Object.assign(outputFiles[exporter.filename], propertySetAssigner(_property2, node.nodes, node));
        } else if (isCustomSelector(node, exporter.prefixes)) {
          var _node$params$match3 = node.params.match(selectorMatch),
              _node$params$match4 = _slicedToArray(_node$params$match3, 3),
              _property3 = _node$params$match4[1],
              _value = _node$params$match4[2];

          Object.assign(outputFiles[exporter.filename], propertyAssigner(_property3, _value, node));
        }
      }
    });

    return jsonExporter(outputFiles, options, root);
  };
});

// Default Assigner functions
function propertyAssigner(rawproperty, rawvalue) {
  return _defineProperty({}, rawproperty, rawvalue);
}

function propertySetAssigner(rawproperty, nodes) {
  return propertyAssigner(rawproperty, Object.assign.apply(Object, _toConsumableArray(nodes.map(function (node) {
    return _defineProperty({}, node.prop, node.value);
  }))));
}

function jsonExporter(outputFiles, options, root) {
  var filePromises = [];

  var _loop = function _loop(i) {
    var filename = options.fileExports[i].filename;

    if (outputFiles[filename]) {
      var contents = JSON.stringify(outputFiles[filename], null, '  ');

      filePromises.push(new Promise(function (resolve, reject) {
        if (!fs.existsSync(options.dest)) {
          var parts = options.dest.split("/");

          for (var j = 1; j <= parts.length; j++) {
            var currentPath = path.join.apply(null, parts.slice(0, j));
            if (!fs.existsSync(currentPath)) {
              fs.mkdirSync(currentPath);
            }
          }
        }

        fs.writeFile(options.dest + filename + '.json', contents, function (error) {
          return error ? reject(error) : resolve();
        });
      }));
    }
  };

  for (var i = 0; i < options.fileExports.length; i++) {
    _loop(i);
  }

  return Promise.all(filePromises);
}