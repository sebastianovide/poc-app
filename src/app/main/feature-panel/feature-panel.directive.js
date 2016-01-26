(function() {
  'use strict';

  angular
    .module('LandApp')
    .directive('laFeaturePanel', featurePanel);

  /** @ngInject */
  function featurePanel() {
    var directive = {
      restrict: 'E',
      templateUrl: 'app/main/feature-panel/feature-panel.html',
      controller: FeaturePanelController,
      controllerAs: 'vmPanel'
    };

    return directive;

    /** @ngInject */
    function FeaturePanelController(ol, $rootScope, $mdSidenav, $mdDialog, mapService, featureMeasureService, projectTagService) {
      var vm = this;
      var activeFeature;
      var panel;

      vm.featureData = {};

      vm.addAttribute = function() {
        vm.featureData.attributes.push({name: "", value: ""});
      };

      vm.removeFeature = function() {
        var confirm = $mdDialog.confirm()
          .title("Are you sure you want to remove this feature?")
          .content("This action cannot be undone and will remove all associated feature data.")
          .ariaLabel("Remove feature")
          .ok("Remove feature")
          .cancel("Cancel");

        $mdDialog.show(confirm).then(function() {
          mapService.removeFeature(activeFeature);
          panel.close();
        });
      };

      vm.performTagSearch = function(query) {
        var regex = new RegExp(query, "i");

        return projectTagService.defaultProjectTags.filter(function(tag) {
          return regex.test(tag.displayText);
        });
      };

      vm.saveFeatureData = function(featureTitle) {
        if (angular.isDefined(featureTitle)) {
          vm.featureData.title = featureTitle;
        }

        activeFeature.set("featureData", vm.featureData);

        mapService.saveDrawingLayers();

        vm.lastSaveTime = Date.now();
      };

      $rootScope.$on("toggle-feature-panel", function(ngEvent, selectEvent) {
        panel = $mdSidenav("feature-panel");

        if (selectEvent.selected.length) {
          activeFeature = selectEvent.selected[0];

          vm.readOnlyData = compileReadOnlyData();
          vm.featureData = angular.extend({
            title: "",
            attributes: [],
            tags: []
          }, activeFeature.get("featureData"));

          panel.open();
        } else {
          panel.close();
        }
      });

      $rootScope.$watch(function() {
        return $mdSidenav("feature-panel").isOpen();
      }, function(isOpen, wasOpen) {
        if (!isOpen && wasOpen) {
          vm.saveFeatureData();
          vm.lastSaveTime = undefined;
        }
      });

      function compileReadOnlyData() {
        var data = {
          area: undefined,
          length: undefined,
          featureType: mapService.getDrawingLayerDetailsByFeature(activeFeature).displayName
        };

        var geometry = activeFeature.getGeometry();

        if (geometry instanceof ol.geom.Polygon) {
          data.area = featureMeasureService.calculateArea(geometry, mapService.getProjection());
        } else if (geometry instanceof ol.geom.LineString) {
          data.length = featureMeasureService.calculateLength(geometry, mapService.getProjection());
        }

        return data;
      }
    }
  }

})();
