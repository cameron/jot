_Jot  Webclient_

# Install Deps and Build

* Install client deps: `bower install`
* Install build system deps: `npm install`
* Then:
  * `gulp serve`
  * `while [ 1 ]; do gulp build; test $? -gt 128 && break; done`
* _NB_: Due to a bug in gaze, the underlying filesystem watcher, `gulp build` must be run twice before `index.html` will contain the appropriate script and link tags.


# Code Organization

Files are organized by UI concern. E.g., all .js, .scss, and .html relating to the login screen live in `src/views/login`.

Data, services, etc live in `src/lib`.


## Composing Views

After creating the files for a new view, you can reference it in html:

```
<px-my-new-view></px-my-new-view>
<!-- or -->
<div px-view="'myNewView'"></div>
<!-- or -->
<div px-view="view"></div> // where $scope.view = 'myNewView'
```

## Angular $scope extensions

See bower_components/hyperscope/hyperscope.js for details on `$scope.$expr`, `$scope.$alias`, or `$scope.$watch('thing', 'anotherStringExpr')`.
