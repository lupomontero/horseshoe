module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jslint: {
      files: [ 'Gruntfile.js', 'index.js', 'bin/horseshoe', 'test/**/*.js' ],
      directives: {
        indent: 2,
        node: true,
        sloppy: true,
        nomen: true,
        plusplus: true
      },
      options: {
        shebang: true
      }
    },

    nodeunit: {
      files: [ 'test/test-*.js' ]
    },

    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
    }

  });

  // Default task.
  grunt.registerTask('default', 'jslint nodeunit');

};
