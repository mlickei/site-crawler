app.directive('modal', function(){
  return {

    templateUrl: 'template.html',
    transclude: true,
    scope: {
      heading: '@',
      open: '=',
      close: '='
    },

    link: function(scope, element, attrs){
      element.addClass('modal');

      scope.close = () => element.removeClass('open');
      scope.open = () => {
        element.addClass('open');
        element.find('input')[0].focus();
      };
    }

  };
});
