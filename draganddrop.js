/**
 * Created with IntelliJ IDEA.
 * User: Ganaraj.Pr
 * Date: 11/10/13
 * Time: 11:27
 * To change this template use File | Settings | File Templates.
 */
angular.module("ngDragDrop",[])
    .directive("uiDraggable", [
        '$parse',
        '$rootScope',
        function ($parse, $rootScope) {
            return function (scope, element, attrs) {
                var dragStartClass = attrs.dragStartClass || "on-drag-start";

                if (window.jQuery && !window.jQuery.event.props.dataTransfer) {
                    window.jQuery.event.props.push('dataTransfer');
                }

                element.prop("draggable", false);
                scope.$watch(attrs.uiDraggable, function (val) {
                    element.prop("draggable", val);
                });

                var dragData = "";
                scope.$watch(attrs.drag, function (val) {
                    dragData = val;
                }, true);

                element.bind("dragstart", function (e) {
                    var sendData = angular.toJson(dragData);
                    var sendChannel = attrs.dragChannel || "defaultchannel";
                    e.dataTransfer.setData("Text", sendData);
                    $rootScope.$broadcast("ngDragDrop.dragstart", sendChannel);

                    element.addClass(dragStartClass);
                });

                //For IE
                element.bind("selectstart",function() {
                    try {
                        this.dragDrop();
                    }
                    catch(e) {}
                    return false;
                }, false);

                element.bind("dragend", function (e) {
                    var sendChannel = attrs.dragChannel || "defaultchannel";
                    $rootScope.$broadcast("ngDragDrop.dragend", sendChannel);
                    if (e.dataTransfer.dropEffect !== "none") {
                        if (attrs.onDropSuccess) {
                            var fn = $parse(attrs.onDropSuccess);
                            scope.$apply(function () {
                                fn(scope, {$event: e});
                            });
                        }
                    }

                    element.removeClass(dragStartClass);
                });

                element.bind('$destory', function () {
                    angular.forEach(['dragstart', 'dragend', 'selectstart'], function (name) {
                        element.unbind(name);
                    });
                    element.unbind('$destory');
                });
            };
        }
    ])
    .directive("uiOnDrop", [
        '$parse',
        '$rootScope',
        function ($parse, $rootScope) {
            return function (scope, element, attrs) {
                var dropChannel = "defaultchannel";
                var dragChannel = "";
                var dragAcceptClass = attrs.dragAcceptClass || "on-drag-accept";
                var dragOverClass = attrs.dragOverClass || "on-drag-over";

                var deregisterNgDragStart, deregisterNgDragEnd;

                function onDragEnter(e) {
                    element.addClass(dragOverClass);
                }

                function onDragLeave(e) {
                    element.removeClass(dragOverClass);
                }

                function onDragOver(e) {

                    if (e.preventDefault) {
                        e.preventDefault(); // Necessary. Allows us to drop.
                    }

                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    e.dataTransfer.dropEffect = 'move';
                    return false;
                }

                function onDrop(e) {
                    if (e.preventDefault) {
                        e.preventDefault(); // Necessary. Allows us to drop.
                    }
                    if (e.stopPropagation) {
                        e.stopPropagation(); // Necessary. Allows us to drop.
                    }

                    var data = e.dataTransfer.getData("Text");
                    data = angular.fromJson(data);
                    var fn = $parse(attrs.uiOnDrop);
                    scope.$apply(function () {
                        fn(scope, {$data: data, $event: e});
                    });

                    leaveDropAcceptancePhase();
                }

                function enterDropAcceptancePhase () {
                    element.bind("dragover", onDragOver);
                    element.bind("dragenter", onDragEnter);
                    element.bind("dragleave", onDragLeave);

                    element.bind("drop", onDrop);
                    element.addClass(dragAcceptClass);
                }

                function leaveDropAcceptancePhase () {
                    element.unbind("dragover", onDragOver);
                    element.unbind("dragenter", onDragEnter);
                    element.unbind("dragleave", onDragLeave);

                    element.unbind("drop", onDrop);
                    element.removeClass(dragAcceptClass);
                    onDragLeave();
                }

                deregisterNgDragStart = scope.$on("ngDragDrop.dragstart", function (event, channel) {
                    dragChannel = channel;
                    if (dropChannel === channel) {
                        enterDropAcceptancePhase();
                    }
                });

                deregisterNgDragEnd = scope.$on("ngDragDrop.dragend", function (event, channel) {
                    dragChannel = "";
                    if (dropChannel === channel) {
                        leaveDropAcceptancePhase();
                    }
                });


                attrs.$observe('dropChannel', function (value) {
                    if (value) {
                        dropChannel = value;
                    }
                });

                element.bind('$destory', function () {
                    (deregisterNgDragStart || angular.noop)();
                    (deregisterNgDragEnd || angular.noop)();

                    element.unbind('$destory');
                });
            };
        }
    ]);
