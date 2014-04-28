angular.module("feature-flags", [])
   .constant("FLAG_PREFIX", "my-app")
   .constant("FLAG_STORAGE", "LOCAL_STORAGE") // (LOCAL_STORAGE / COOKIE / REMOTE)
.constant("FLAGS_URL", "data/flags.json")
   .config(function($provide) {
      return $provide.provider("SettingStore", function(FLAG_STORAGE) {
         return {
            $get: function() {
               return {
                  LOCAL_STORAGE: {
                     isSet: function(key) {
                        return localStorage.getItem(key) !== null;
                     },
                     set: function(key) {
                        localStorage.setItem(key, true);
                     },
                     remove: function(key) {
                        localStorage.removeItem(key);
                     }
                  },
                  COOKIE: {
                     isSet: function(key) {
                        return document.cookie.indexOf(key) > -1;
                     },
                     set: function(key) {
                        document.cookie = key + "=true;path=/;";
                     },
                     remove: function(key) {
                        document.cookie = key + "=false;path=/;expires=" +
                           new Date(0);
                     }
                  }
               }[FLAG_STORAGE];
            }
         };
      });
   })
   .run(function($rootScope, FlagsService, FLAGS_URL) {
      $rootScope.featureFlagEnable = FlagsService.enable;
      $rootScope.featureFlagDisable = FlagsService.disable;

      // If user configured flags
      // in config we go ahead and
      // fetch on run. Otherwise
      // we wait for the user to
      // trigger it manually.
      // U: Flags url is dependant
      // on variables not accessible
      // yet
      if( FLAGS_URL )
         FlagsService.fetch();
   })
   .directive('featureFlag', ['FlagsService', '$animate', function(FlagsService, $animate) {
      return {
         transclude: 'element',
         priority: 600,
         terminal: true,
         restrict: 'A',
         $$tlb: true,
         link: function($scope, $element, $attr, ctrl, $transclude) {
            var block, childScope, previousElements;
            $scope.$watch($attr.featureFlag, function featureFlagWatchAction(
               value) {

               // if the feature is enabled
               if (FlagsService.isOn(value)) {
                  if (!childScope) {
                     childScope = $scope.$new();
                     $transclude(childScope, function(clone) {
                        clone[clone.length++] = document.createComment(
                           ' end featureFlag: ' + $attr.featureFlag + ' '
                        );
                        // Note: We only need the first/last node of the cloned nodes.
                        // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                        // by a directive with templateUrl when it's template arrives.
                        block = {
                           clone: clone
                        };
                        $animate.enter(clone, $element.parent(), $element);
                     });
                  }
               } else {
                  if (previousElements) {
                     previousElements.remove();
                     previousElements = null;
                  }
                  if (childScope) {
                     childScope.$destroy();
                     childScope = null;
                  }
                  if (block) {
                     previousElements = getBlockElements(block.clone);
                     $animate.leave(previousElements, function() {
                        previousElements = null;
                     });
                     block = null;
                  }
               }
            });

         }
      };
   }])
   .service("FlagsService", function($http, FLAG_PREFIX, FLAGS_URL,
      SettingStore) {
      var cache = [],

         get = function() {
            return cache;
         },

         fetch = function( url ) {

            // enables manual fetching 
            if(!FLAGS_URL){
               FLAGS_URL = url;
            }

            return $http.get(FLAGS_URL)
               .success(function(flags) {
                  if( !flags )  return;
                  angular.forEach(flags, function(flag){
                     flag.active = isOn(flag.key);
                  });
                  angular.copy(flags, cache);
               });
         },

         enable = function(flag) {
            flag.active = true;
            SettingStore.set(FLAG_PREFIX + "." + flag.key);
         },

         disable = function(flag) {
            flag.active = false;
            SettingStore.remove(FLAG_PREFIX + "." + flag.key);
         },

         isOn = function(key) {
            return SettingStore.isSet(FLAG_PREFIX + "." + key);
         };

      return {
         fetch: fetch,
         get: get,
         enable: enable,
         disable: disable,
         isOn: isOn
      };
   })
