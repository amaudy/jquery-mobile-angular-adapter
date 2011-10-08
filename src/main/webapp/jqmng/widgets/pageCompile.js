/**
 * Integration of the page widget.
 */
define(['jquery', 'angular', 'jqmng/globalScope'], function($, angular, globalScope) {
    // redirect all events from the page widget,
    // so we can intercept them.
    $.mobile.page.prototype.widgetEventPrefix = 'jqmngpage';

    /**
     * This is a copy of the degrade inputs plugin of jquery
     * mobile. We need it here to execute this replacement
     * at the right time, i.e. before we do the page compile with
     * angular.
     * @param targetPage
     */
    function degradeInputs(targetPage) {
        var page = targetPage.data( "page" ),
            o = page.options;

        // degrade inputs to avoid poorly implemented native functionality
        targetPage.find( "input" ).not( o.keepNative ).each(function() {
            var $this = $( this ),
                type = this.getAttribute( "type" ),
                optType = o.degradeInputs[ type ] || "text";

            if ( o.degradeInputs[ type ] ) {
                $this.replaceWith(
                    $( "<div>" ).html( $this.clone() ).html()
                        .replace( /\s+type=["']?\w+['"]?/, " type=\"" + optType + "\" data-" + $.mobile.ns + "type=\"" + type + "\" " )
                );
            }
        });
    }

    $('div').live('jqmngpagecreate', function(event) {
        var page = $(event.target);
        var parentScope = globalScope.globalScope();
        var childScope = angular.scope(parentScope);
        degradeInputs(page);
        angular.compile(page)(childScope);
        parentScope.$eval();
        // The second pagecreate does only initialize
        // the widgets that we did not already create by angular.
        page.trigger("pagecreate");
    });

    $('div').live('jqmngpagebeforeshow', function(event, data) {
        var currPageScope = $(event.target).scope();
        if (currPageScope) {
            currScope = currPageScope;
            currScope.$service("$updateView")();
        }
        var page = $(event.target);
        page.trigger("pagebeforeshow", data);
    });

    $('div').live('jqmngpagebeforehide', function(event, data) {
        var page = $(event.target);
        page.trigger("pagebeforehide", data);
    });

    $('div').live('jqmngpagehide', function(event, data) {
        var page = $(event.target);
        page.trigger("pagehide", data);
    });

    $('div').live('jqmngpageshow', function(event, data) {
        var page = $(event.target);
        page.trigger("pageshow", data);
    });

    /**
     * Create jquery elements when elements were added to the dom.
     */
    $(document).bind('elementsAdded', function(event) {
        $(event.target).trigger('create');
    });

    var currScope = null;
    // The eval function of the global scope should eval
    // the active scope only.
    globalScope.onCreate(function(scope) {
        scope.$onEval(function() {
            // Note that wen cannot use $.mobile.activePage here,
            // as this is not set until the pageshow event, but
            // our pages are created before this!
            if (currScope) {
                currScope.$eval();
            }
        });
    });

    /**
     * Deactivate the url changing capabilities
     * of angular, so we do not get into trouble with
     * jquery mobile: angular saves the current url before a $eval
     * and updates the url after the $eval.
     * <p>
     * This also replaces the hashListen implementation
     * of angular by the jquery mobile impementation,
     * so we do not have two polling functions, ...
     * <p>
     * Attention: By this, urls can no more be changed via angular's $location service!
     */
    (function(angular) {
        var oldBrowser = angular.service("$browser");
        angular.service("$browser", function() {
            var res = oldBrowser.apply(this, arguments);
            res.onHashChange = function(handler) {
                $(window).bind('hashchange', handler);
                return handler;
            };
            res.setUrl = function() {
            };
            return res;
        }, {$inject:['$log']});
    })(angular);
});