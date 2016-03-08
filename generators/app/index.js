'use strict';
var yo = require('yeoman-generator'),
	chalk = require('chalk'),
	yosay = require('yosay'),
	mkdirp = require('mkdirp'),
	path = require('path'),
	config = require('./config.json');

////////////////////////////////////////////////////////////////////////////////////////////
// initializing - Your initialization methods (checking current project state, getting configs, etc)
// prompting - Where you prompt users for options (where you'd call this.prompt())
// configuring - Saving configurations and configure the project (creating .editorconfig files and other metadata files)
// default - If the method name doesn't match a priority, it will be pushed to this group.
// writing - Where you write the generator specific files (routes, controllers, etc)
// conflicts - Where conflicts are handled (used internally)
// install - Where installation are run (npm, bower)
// end - Called last, cleanup, say good bye, etc
///////////////////////////////////////////////////////////////////////////////////////////

module.exports = yo.generators.Base.extend({
	constructor: function (arg, options) {
		yo.generators.Base.apply(this, arguments);
		this.settings = config;

		for (var i = 0; i < arguments.length; i = i + 1) {
			if (arguments[i]['skipInstall'] || arguments[i]['skip-install']) {
				this.log(yosay(
					'Hi there, the ' + chalk.bold(chalk.green('frontend-incubator')) +
					' heavily relies on the install step. I cannot guarantee any success when you continue. You can press ' +
					chalk.yellow('\'ctrl + c\'') + ' to cancel. Proceed only when you really know what you\'re doing.'));
				this.skipDefault = true;
			}
		}
	},
	prompting: function () {
		var done = this.async();

		if (!this.skipDefault) {
			// Have Yeoman greet the user.
			this.log(yosay(
				'Welcome to the ' + chalk.bold.green('frontend-incubator') + ' generator!'
			));
		}

		var prompts = [{
			name: 'projectName',
			message: 'What is the name of your project?',
			default: path.basename(process.cwd())
		}, {
			name: 'projectVersion',
			message: 'What is version of your project?',
			default: '1.0.0'
		}, {
			name: 'es2015orLoose',
			message: 'Does Babel need to run in \'loose\' mode?',
			default: true,
			type: 'confirm'
		}, {
			name: 'dependencies',
			message: 'Select the dependencies you want to install:',
			type: 'checkbox',
			choices: [{
				name: 'fastclick' + chalk.grey(' - Polyfill to remove click delays on browsers with touch UIs'),
				value: 'fastclick'
			}, {
				name: 'fastdom' + chalk.grey(' - Eliminates layout thrashing by batching DOM read/write operations '),
				value: 'fastdom'
			}, {
				name: 'jQuery' + chalk.grey(' - A cross-platform JavaScript library designed to simplify the client-side scripting of HTML'),
				value: 'jquery',
				checked: true
			}]
		}, {
			name: 'itcss',
			message: 'Do you want to use ITCSS?',
			default: true,
			type: 'confirm'
		}, {
			name: 'configureFTP',
			message: 'Would you like to configure FTP? (You can always do this later in the config.json)',
			default: false,
			type: 'confirm'
		}, {
			name: 'ftpHost',
			message: 'FTP host',
			type: 'input',
			when: function (answers) {
				return answers.configureFTP;
			}
		}, {
			name: 'ftpUser',
			message: 'FTP username',
			type: 'input',
			when: function (answers) {
				return answers.configureFTP;
			}
		}, {
			name: 'ftpPass',
			message: 'FTP password',
			type: 'password',
			when: function (answers) {
				return answers.configureFTP;
			}
		}];


		this.prompt(prompts, function (props) {
			this.props = props;
			done();

		}.bind(this));
	},

	writing: function () {

		this.fs.copyTpl(
			this.templatePath('package.json'),
			this.destinationPath('package.json'), {
				name: this.props.projectName,
				version: this.props.projectVersion
			}
		);

		this.fs.copyTpl(
			this.templatePath('config.json'),
			this.destinationPath('config.json'), {
				paths: this.settings.paths,
				esVersion: this.props.es2015orLoose,
				ftp: {
					host: this.props.ftpHost || '',
					user: this.props.ftpUser || '',
					pass: this.props.ftpPass || ''
				}
			}
		);

		this.fs.copyTpl(
			this.templatePath('README.md'),
			this.destinationPath('README.md'), {
				name: this.props.projectName
			}
		);

		var simpleCopyFiles = ['.editorconfig', '.gitattributes', '.gitignore', '.jshintrc', 'gulpfile.js', 'tasks.json'];
		for (var i = 0; i < simpleCopyFiles.length; i++) {
			this.fs.copyTpl(
				this.templatePath(simpleCopyFiles[i]),
				this.destinationPath(simpleCopyFiles[i])
			);
		}

		var paths = this.settings.paths.src,
			keep = '/.keep',
			keepText = 'remove this file when you\'ve added content to this folder',
			stylePath = paths.asset.scss;

		if (this.props.dependencies.length > 0) {
			this.fs.copyTpl(
				this.templatePath(paths.asset.javascript + '/site.js.txt'),
				this.destinationPath(paths.asset.javascript + '/site.js'),
				{dependencies: this.props.dependencies}
			);
		} else {
			this.fs.write(paths.asset.javascript + keep, keepText);
		}

		this.fs.write(paths.asset.image + keep, keepText);
		this.fs.write(paths.asset.font + keep, keepText);

		if (this.props.itcss) {
			this.fs.write(stylePath + '/settings/_settings.scss', '// import all settings here');
			this.fs.write(stylePath + '/tools/_tools.scss', '// import all tools here');
			this.fs.write(stylePath + '/generic/_generic.scss', '// import all generic styles here');
			this.fs.write(stylePath + '/base/_base.scss', '// import all base styles here');
			this.fs.write(stylePath + '/components/_components.scss', '// import all component styles here');
			this.fs.write(stylePath + '/theme/_theme.scss', '// import all theme styles here');
			this.fs.write(stylePath + '/trumps/_trumps.scss', '// import all trumps here');
			this.fs.copy(this.templatePath('src/asset/scss/itcss.scss'), this.destinationPath(stylePath + '/style.scss'))
		} else {
			this.fs.write(stylePath + keep, keepText);
		}

		this.fs.write(paths.prototype.template + keep, keepText);
		this.fs.write(paths.prototype.data + keep, keepText);
		this.fs.write(paths.prototype.webroot + keep, keepText);

		// @TODO [issue 4](https://bitbucket.org/incentro-ondemand/generator-frontend-incubator/issues/4/load-kss-template-from-server-instead-of)
		var KSSDir = paths.patternLibrary.root;
		this.bulkDirectory(KSSDir, KSSDir);
	},

	install: function () {
		var useLoosePreset = this.props.es2015orLoose;
		var devDependencies = this.settings.dependencies;
		if (useLoosePreset === true) {
			devDependencies.push('babel-preset-es2015-loose');
		}
		devDependencies.push('babel-preset-es2015');
		this.npmInstall(devDependencies, {saveDev: true});

		// install extra dependencies:
		var dependencies = this.props.dependencies;
		if (dependencies && dependencies.length > 0) {
			this.npmInstall(dependencies, {save: true});
		}

		// yeoman defaults with bower so turn it off here
		this.installDependencies({bower: false});
	},
	end: function () {
		this.log(yosay(
			'Thank you for using ' + chalk.bold.green('frontend-incubator') + ' generator!'
		));
	}
});
