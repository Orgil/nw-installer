'use strict';

  var ChildProcess, asar, fs, path, temp, _;

  ChildProcess = require('child_process');

  fs = require('fs');

  path = require('path');

  temp = require('temp');

  _ = require('underscore');

  temp.track();

module.exports = function(grunt) {

  //loading all tasks from plugins
  // require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  // grunt.loadNpmTasks('grunt-atom-shell-installer')

  //starting to config
  grunt.initConfig({
    'nw-installer': {
      appDirectory: 'app',
      outputDirectory: 'dist',
      authors: 'Smart City',
      exe: 'AutoTeever_0.1.5.exe'
    }
  });

  var exec;
  exec = function(options, callback) {
    return ChildProcess.execFile(options.cmd, options.args, function(error, stdout, stderr) {
      if (stderr) {
        grunt.log.error(stderr);
      }
      return callback(error);
    });
  };

  grunt.registerTask('nw-installer', 'Create nw.js installer', function() {
    var appDirectory, appMetadata, appResourcesDirectory, args, asarFile, certificateFile, certificatePassword,
      cmd, config, done, loadingGif, metadata, nugetOutput, nuspecContent, outputDirectory, remoteReleases,
      signWithParams, syncReleases, targetNuspecPath, template, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;

    this.requiresConfig("" + this.name + ".appDirectory");
    done = this.async();
    config = grunt.config(this.name);
    appDirectory = path.resolve(config.appDirectory);
    grunt.file.copy(path.resolve(__dirname, 'vendor', 'Update.exe'), path.join(appDirectory, 'Update.exe'));
    outputDirectory = (_ref = config.outputDirectory) != null ? _ref : 'installer';
    outputDirectory = path.resolve(outputDirectory);
    loadingGif = (_ref1 = config.loadingGif) != null ? _ref1 : path.resolve(__dirname, 'resources', 'install-spinner.gif');
    loadingGif = path.resolve(loadingGif);
    certificateFile = config.certificateFile, certificatePassword = config.certificatePassword, remoteReleases = config.remoteReleases, signWithParams = config.signWithParams;

    appResourcesDirectory = path.join(appDirectory);
    appMetadata = grunt.file.readJSON(path.join(appResourcesDirectory, 'package.json'));

    metadata = _.extend({}, appMetadata, config);
    if (metadata.authors == null) {
      metadata.authors = (_ref2 = (_ref3 = (_ref4 = metadata.author) != null ? _ref4.name : void 0) != null ? _ref3 : metadata.author) != null ? _ref2 : '';
    }
    if (metadata.description == null) {
      metadata.description = '';
    }
    if (metadata.exe == null) {
      metadata.exe = "" + metadata.name + ".exe";
    }
    if (metadata.iconUrl == null) {
      metadata.iconUrl = 'https://raw.githubusercontent.com/atom/atom-shell/master/atom/browser/resources/win/atom.ico';
    }
    if (metadata.owners == null) {
      metadata.owners = metadata.authors;
    }
    if (metadata.title == null) {
      metadata.title = (_ref5 = metadata.productName) != null ? _ref5 : metadata.name;
    }
    metadata.version = metadata.version.replace(/-.*$/, '');
    template = _.template(grunt.file.read(path.resolve(__dirname, 'template.nuspec')));
    nuspecContent = template(metadata);
    nugetOutput = temp.mkdirSync('squirrel-installer-');
    targetNuspecPath = path.join(nugetOutput, "" + metadata.name + ".nuspec");
    grunt.file.write(targetNuspecPath, nuspecContent);
    cmd = path.resolve(__dirname, 'vendor', 'nuget.exe');
    args = ['pack', targetNuspecPath, '-BasePath', appDirectory, '-OutputDirectory', nugetOutput, '-NoDefaultExcludes'];

    syncReleases = function(cb) {
      if (remoteReleases != null) {
        cmd = path.resolve(__dirname, 'vendor', 'SyncReleases.exe');
        args = ['-u', remoteReleases, '-r', outputDirectory];
        return exec({
          cmd: cmd,
          args: args
        }, cb);
      } else {
        return process.nextTick(function() {
          return cb();
        });
      }
    };

    return exec({
      cmd: cmd,
      args: args
    }, function(error) {
      var nupkgPath;
      if (error != null) {
        return done(error);
      }
      nupkgPath = path.join(nugetOutput, "" + metadata.name + "." + metadata.version + ".nupkg");
      return syncReleases(function(error) {
        var setupIconPath;
        if (error != null) {
          return done(error);
        }
        cmd = path.resolve(__dirname, 'vendor', 'Update.com');
        args = ['--releasify', nupkgPath, '--releaseDir', outputDirectory, '--loadingGif', loadingGif];
        if (signWithParams != null) {
          args.push('--signWithParams');
          args.push(signWithParams);
        } else if ((certificateFile != null) && (certificatePassword != null)) {
          args.push('--signWithParams');
          args.push("/a /f \"" + (path.resolve(certificateFile)) + "\" /p \"" + certificatePassword + "\"");
        }
        if (config.setupIcon) {
          setupIconPath = path.resolve(config.setupIcon);
          args.push('--setupIcon');
          args.push(setupIconPath);
        }
        return exec({
          cmd: cmd,
          args: args
        }, function(error) {
          var setupPath;
          if (error != null) {
            return done(error);
          }
          if (metadata.productName) {
            setupPath = path.join(outputDirectory, "" + metadata.productName + "Setup.exe");
            fs.renameSync(path.join(outputDirectory, 'Setup.exe'), setupPath);
          }
          return done();
        });
      });
    });

  });

};
