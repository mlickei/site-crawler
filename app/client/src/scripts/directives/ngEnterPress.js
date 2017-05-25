app.directive('ngEnterPress', function(){
  return function($scope, element, attrs){
    element.bind('keypress', event => {
      if(event.which == 13){
        $scope.$apply(() => $scope.$eval(attrs.ngEnterPress));
        event.preventDefault();
      }
    });
  }
});
