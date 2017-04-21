const fs = require('fs');
const path = require('path');

// custom variable matches
const propertyMatch    = /^--([_a-zA-Z]+[_a-zA-Z0-9-]*)$/;
const propertySetMatch = /^--([_a-zA-Z]+[_a-zA-Z0-9-]*):$/;
const mediaQueryMatch  = /^--([_a-zA-Z]+[_a-zA-Z0-9-]*)\s+(.+)$/;
const selectorMatch    = /^:--([_a-zA-Z]+[_a-zA-Z0-9-]*)\s+(.+)$/;

// plugin
module.exports = require('postcss').plugin('postcss-extract-variable-scheme', (config = {}) => {
  let options = {
    dest: 'build/variables/',
    fileExports: [
      {
        prefixes: ['fs', 'lh'],
        filename: 'typography'
      }
    ]
	}

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
      var regexp = new RegExp('^--' + prefix + '-([_a-zA-Z]+[_a-zA-Z0-9-]*):$')
      
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
      var regexp = new RegExp('^:--' + prefix + '-([_a-zA-Z]+[_a-zA-Z0-9-]*)\\s+(.+)$')
      
      if (regexp.test(node.params)) {
        reMatch = true;
        break;
      }
    }

    return node.type === 'atrule' && node.name === 'custom-selector' && reMatch;
  }

	return (root) => {
    var outputFiles = {};

		root.walk(
			(node) => {
        for (var i = 0; i < options.fileExports.length; i++) {
          var exporter = options.fileExports[i];
          outputFiles[exporter.filename] = outputFiles[exporter.filename] || {};

          if (isCustomMediaQuery(node, exporter.prefixes)) {
            const [ , property, value ] = node.params.match(mediaQueryMatch);
            Object.assign(outputFiles[exporter.filename], propertyAssigner(property, value, node));
          }
          else if (isCustomProperty(node, exporter.prefixes)) {
            const [ , property ] = node.prop.match(propertyMatch);
            Object.assign(outputFiles[exporter.filename], propertyAssigner(property, node.value, node));
          }
          else if (isCustomPropertySet(node, exporter.prefixes)) {
            const [ , property ] = node.selector.match(propertySetMatch);
            Object.assign(outputFiles[exporter.filename], propertySetAssigner(property, node.nodes, node));
          }
          else if (isCustomSelector(node, exporter.prefixes)) {
            const [ , property, value ] = node.params.match(selectorMatch);
            Object.assign(outputFiles[exporter.filename], propertyAssigner(property, value, node));
          }
        }
			}
		);

		return jsonExporter(outputFiles, options, root)
	};
});

// Default Assigner functions
function propertyAssigner(rawproperty, rawvalue) {
	return {
		[rawproperty]: rawvalue
	};
}

function propertySetAssigner(rawproperty, nodes) {
	return propertyAssigner(
		rawproperty,
		Object.assign(
			...nodes.map(
				(node) => {
					return {
						[node.prop]: node.value
					};
				}
			)
		)
	);
}

function jsonExporter(outputFiles, options, root) {
  var filePromises = [];

  for (let i = 0; i < options.fileExports.length; i++) {
    const filename = options.fileExports[i].filename;

    if (outputFiles[filename]) {
      const contents = JSON.stringify(outputFiles[filename], null, '  ');

      filePromises.push(new Promise((resolve, reject) => {
        if (!fs.existsSync(options.dest)) {
          const parts = options.dest.split("/");

          for (let j = 1; j <= parts.length; j++) {
            const currentPath = path.join.apply(null, parts.slice(0, j));
            if(!fs.existsSync(currentPath)) {
              fs.mkdirSync(currentPath)
            }
          }
        }

        fs.writeFile(
          options.dest + filename + '.json',
          contents,
          (error) => error ? reject(error) : resolve()
        );
      }));
    }
  }

	return Promise.all(filePromises)
}