module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: [ 'Gruntfile.js', 'index.js', 'bin/horseshoe', 'test/**/*.js' ]
    },

    nodeunit: {
      files: [ 'test/test-*.js' ]
    },

    watch: {
      scripts: {
        files: [ 'Gruntfile.js', 'index.js', 'test/**/*.js' ],
        tasks: 'default'
      }
    }

  });

  // Default task.
  grunt.registerTask('default', [ 'jshint', 'nodeunit' ]);

};
