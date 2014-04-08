module.exports = function(grunt) {

   grunt.initConfig({
      connect: {
         server: {
            options: {
               port: 9999,
               base: 'demo',
               keepalive: true
            }
         }
      },

      open: {
         all: {
            path: 'http://localhost:<%= connect.server.options.port %>/index.html'
         }
      },

      jshint: {
         options: {
            reporter: require('jshint-stylish')
         },
         src: [
            'demo/scripts/**/*.js',
            'src/**/*.js',
            'test/**/*Spec.js'
         ]
      },

      karma: {
         unit: {
            options: {
               frameworks: ['jasmine'],
               files: [
                  'bower_components/angular/angular.js',
                  'bower_components/angular-animate/angular-animate.js',
                  'test/vendor/angular-mocks.js',
                  'src/**/*.js',
                  'test/**/*Spec.js'
               ],
               browsers: ['PhantomJS'],
               singleRun: true,
               reporters: ['progress', 'coverage'],
               preprocessors: {
                  'src/**/*.js': ['coverage']
               },
               coverageReporter: {
                  type: 'html',
                  dir: 'test/coverage/'
               }
            }
         }
      },
      watch: {
         test: {
            files: ['src/*.js'],
            tasks: ['test'],
            options: {
               spawn: false,
            },
         },
      },
   });

   grunt.loadNpmTasks('grunt-contrib-connect');
   grunt.loadNpmTasks('grunt-contrib-jshint');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-open');
   grunt.loadNpmTasks('grunt-karma');

   grunt.registerTask('server', ['open', 'connect']);
   grunt.registerTask('test', ['karma']);

   grunt.registerTask('default', ['jshint', 'test'])

};
