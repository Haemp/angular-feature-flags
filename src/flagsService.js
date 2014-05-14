angular.module("FeatureFlags", [])

   /**
    * @param LOCALSTORAGE_NAME the index where we save the feature flags
    * @param FLAGS_URL the url to the end point which gives us the array
                       of flags. If this is not set we let the user handle
                       it manually
    */
   .constant('LOCALSTORAGE_NAME', 'featureFlags')
   .constant('FLAGS_URL', undefined)

   /**
    * Handles storage of the feature flags
    */
   .service('FlagsModel', function(LOCALSTORAGE_NAME, $http, FLAGS_URL){
   	var self = this;
      self.flags = [];

      // load flags into memory
      // either from remote or if that is not
      // available - localStorage
      self.getFlags = function(url){

         $http.get(url || FLAGS_URL).then(function( resp ){
            self.flags = resp.data;

            self._save()
         }, function(){
            console.log('No feature flags');

            // load feature flags from the local storage
            self._load();
         });
      }

      // loops through all the feature flags
      // and determines if the current feature
      // is on or not
      // TODO: Could be improved by having
      // flags['flagKey']
      self.isOn = function( featureName ){
         var flag;
         for (var i = 0; i < self.flags.length; i++) {
            flag = self.flags[i];
            if( flag.key == featureName ) return true;
         }
         return false;
      };

      self._save = function(){
         if( self.flags ){
            localStorage.setItem(LOCALSTORAGE_NAME, JSON.stringify(self.flags) );
         }
      };

      self._load = function(){

         try{
            self.flags = JSON.parse(localStorage.get(LOCALSTORAGE_NAME));
         }catch(e){
            console.log('There was an error parsing the feature flags');
            self.flags = [];
         }
      }
   })

   /**
    * Try to fetch on startup. If the URL is accessible
    * this will work, otherwise we rely on the user triggering
    * it.
    */
   .run(function(FeatureFlags, FLAGS_URL) {

      // If user configured flags
      // in config we go ahead and
      // fetch on run. Otherwise
      // we wait for the user to
      // trigger it manually.
      // U: Flags url is dependant
      // on variables not accessible
      // yet
      if( FLAGS_URL )
         FeatureFlags.fetch();
   })

   /**
    * This is basically an ng-if directive
    * hooked in to the flags model
    */
   .directive('featureFlag', ['FlagsModel', '$animate', function(FlagsModel, $animate) {
      return {
         transclude: 'element',
         priority: 600,
         terminal: true,
         restrict: 'A',
         $$tlb: true,
         link: function($scope, $element, $attr, ctrl, $transclude) {
            var block, childScope, previousElements;

            $scope.$watch(function() {
               return FlagsModel.isOn($attr.featureFlag);
            }, function featureFlagWatchAction(value, oldValue) {

               // if the feature is enabled
               if (value) {
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


	.directive('featureFlagOff', ['FlagsModel', '$animate', function(FlagsModel, $animate) {
	      return {
	         transclude: 'element',
	         priority: 600,
	         terminal: true,
	         restrict: 'A',
	         $$tlb: true,
	         link: function($scope, $element, $attr, ctrl, $transclude) {
	            var block, childScope, previousElements;

	            $scope.$watch(function() {
	               return FlagsModel.isOn($attr.featureFlagOff);
	            }, function featureFlagWatchAction(value, oldValue) {

	               // if the feature is enabled
	               if (!value) {
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



   /**
    * Public API
    *    - fetch
    */
   .service("FeatureFlags", function( FlagsModel ) {
      var self = this;

      self.fetch = function(url){
         FlagsModel.getFlags(url);
      }
   });
