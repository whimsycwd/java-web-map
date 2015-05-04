$(document).ready(function () {
  var loaderTimeout;

  OSM.loadSidebarContent = function(path, callback) {
    map.setSidebarOverlaid(false);

    clearTimeout(loaderTimeout);

    loaderTimeout = setTimeout(function() {
      $('#sidebar_loader').show();
    }, 200);

    // IE<10 doesn't respect Vary: X-Requested-With header, so
    // prevent caching the XHR response as a full-page URL.
    if (path.indexOf('?') >= 0) {
      path += '&xhr=1';
    } else {
      path += '?xhr=1';
    }

    $('#sidebar_content')
      .empty();

    $.ajax({
      url: path,
      dataType: "html",
      complete: function(xhr) {
        clearTimeout(loaderTimeout);
        $('#flash').empty();
        $('#sidebar_loader').hide();

        var content = $(xhr.responseText);

        if (xhr.getResponseHeader('X-Page-Title')) {
          var title = xhr.getResponseHeader('X-Page-Title');
          document.title = decodeURIComponent(title);
        }

        $('head')
          .find('link[type="application/atom+xml"]')
          .remove();

        $('head')
          .append(content.filter('link[type="application/atom+xml"]'));

        $('#sidebar_content').html(content.not('link[type="application/atom+xml"]'));

        if (callback) {
          callback();
        }
      }
    });
  };

  var params = OSM.mapParams();

  var map = new L.OSM.Map("map", {
    zoomControl: false,
    layerControl: false
  });

  map.attributionControl.setPrefix('');

  map.updateLayers(params.layers);

  map.on("baselayerchange", function (e) {
    if (map.getZoom() > e.layer.options.maxZoom) {
      map.setView(map.getCenter(), e.layer.options.maxZoom, { reset: true });
    }
  });

  var position = $('html').attr('dir') === 'rtl' ? 'topleft' : 'topright';

  L.OSM.zoom({position: position})
    .addTo(map);

  L.control.locate({
    position: position,
    strings: {
      title: I18n.t('javascripts.map.locate.title'),
      popup: I18n.t('javascripts.map.locate.popup')
    }
  }).addTo(map);

  var sidebar = L.OSM.sidebar('#map-ui')
    .addTo(map);

  L.OSM.layers({
    position: position,
    layers: map.baseLayers,
    sidebar: sidebar
  }).addTo(map);

  L.OSM.key({
    position: position,
    sidebar: sidebar
  }).addTo(map);

  L.OSM.share({
    position: position,
    sidebar: sidebar,
    short: true
  }).addTo(map);

  L.OSM.note({
    position: position,
    sidebar: sidebar
  }).addTo(map);

  L.OSM.query({
    position: position,
    sidebar: sidebar
  }).addTo(map);

  L.control.scale()
    .addTo(map);

  if (OSM.STATUS !== 'api_offline' && OSM.STATUS !== 'database_offline') {
    OSM.initializeNotes(map);
    if (params.layers.indexOf(map.noteLayer.options.code) >= 0) {
      map.addLayer(map.noteLayer);
    }

    OSM.initializeBrowse(map);
    if (params.layers.indexOf(map.dataLayer.options.code) >= 0) {
      map.addLayer(map.dataLayer);
    }
  }

  var placement = $('html').attr('dir') === 'rtl' ? 'right' : 'left';
  $('.leaflet-control .control-button').tooltip({placement: placement, container: 'body'});

  var expiry = new Date();
  expiry.setYear(expiry.getFullYear() + 10);

  map.on('moveend layeradd layerremove', function() {
    updateLinks(
      map.getCenter().wrap(),
      map.getZoom(),
      map.getLayersCode(),
      map._object);

    $.removeCookie("_osm_location");
    $.cookie("_osm_location", OSM.locationCookie(map), { expires: expiry, path: "/" });
  });

  if ($.cookie('_osm_welcome') === 'hide') {
    $('.welcome').hide();
  }

  $('.welcome .close').on('click', function() {
    $('.welcome').hide();
    $.cookie("_osm_welcome", 'hide', { expires: expiry });
  });

  if (OSM.PIWIK) {
    map.on('layeradd', function (e) {
      if (e.layer.options) {
        var goal = OSM.PIWIK.goals[e.layer.options.keyid];

        if (goal) {
          $('body').trigger('piwikgoal', goal);
        }
      }
    });
  }

  if (params.bounds) {
    map.fitBounds(params.bounds);
  } else {
    map.setView([params.lat, params.lon], params.zoom);
  }

  var marker = L.marker([0, 0], {icon: OSM.getUserIcon()});

  if (params.marker) {
    marker.setLatLng([params.mlat, params.mlon]).addTo(map);
  }

  $("#homeanchor").on("click", function(e) {
    e.preventDefault();

    var data = $(this).data(),
      center = L.latLng(data.lat, data.lon);

    map.setView(center, data.zoom);
    marker.setLatLng(center).addTo(map);
  });

  function remoteEditHandler(bbox, object) {
    var loaded = false,
        url = document.location.protocol === "https:" ?
        "https://127.0.0.1:8112/load_and_zoom?" :
        "http://127.0.0.1:8111/load_and_zoom?",
        query = {
          left: bbox.getWest() - 0.0001,
          top: bbox.getNorth() + 0.0001,
          right: bbox.getEast() + 0.0001,
          bottom: bbox.getSouth() - 0.0001
        };

    if (object) query.select = object.type + object.id;

    var iframe = $('<iframe>')
        .hide()
        .appendTo('body')
        .attr("src", url + querystring.stringify(query))
        .on('load', function() {
          $(this).remove();
          loaded = true;
        });

    setTimeout(function () {
      if (!loaded) {
        alert(I18n.t('site.index.remote_failed'));
        iframe.remove();
      }
    }, 1000);

    return false;
  }

  $("a[data-editor=remote]").click(function(e) {
    var params = OSM.mapParams(this.search);
    remoteEditHandler(map.getBounds(), params.object);
    e.preventDefault();
  });

  if (OSM.params().edit_help) {
    $('#editanchor')
      .removeAttr('title')
      .tooltip({
        placement: 'bottom',
        title: I18n.t('javascripts.edit_help')
      })
      .tooltip('show');

    $('body').one('click', function() {
      $('#editanchor').tooltip('hide');
    });
  }

  OSM.Index = function(map) {
    var page = {};

    page.pushstate = page.popstate = function() {
      map.setSidebarOverlaid(true);
      document.title = I18n.t('layouts.project_name.title');
    };

    page.load = function() {
      var params = querystring.parse(location.search.substring(1));
      if (params.query) {
        $("#sidebar .search_form input[name=query]").value(params.query);
      }
      if (!("autofocus" in document.createElement("input"))) {
        $("#sidebar .search_form input[name=query]").focus();
      }
      return map.getState();
    };

    return page;
  };

  OSM.Browse = function(map, type) {
    var page = {};

    page.pushstate = page.popstate = function(path, id) {
      OSM.loadSidebarContent(path, function() {
        addObject(type, id);
      });
    };

    page.load = function(path, id) {
      addObject(type, id, true);
    };

    function addObject(type, id, center) {
      map.addObject({type: type, id: parseInt(id)}, function(bounds) {
        if (!window.location.hash && bounds.isValid() &&
            (center || !map.getBounds().contains(bounds))) {
          OSM.router.withoutMoveListener(function () {
            map.fitBounds(bounds);
          });
        }
      });
    }

    page.unload = function() {
      map.removeObject();
    };

    return page;
  };

  var history = OSM.History(map);

  OSM.router = OSM.Router(map, {
    "/":                           OSM.Index(map),
    "/search":                     OSM.Search(map),
    "/directions":                 OSM.Directions(map),
    "/export":                     OSM.Export(map),
    "/note/new":                   OSM.NewNote(map),
    "/history/friends":            history,
    "/history/nearby":             history,
    "/history":                    history,
    "/user/:display_name/history": history,
    "/note/:id":                   OSM.Note(map),
    "/node/:id(/history)":         OSM.Browse(map, 'node'),
    "/way/:id(/history)":          OSM.Browse(map, 'way'),
    "/relation/:id(/history)":     OSM.Browse(map, 'relation'),
    "/changeset/:id":              OSM.Changeset(map),
    "/query":                      OSM.Query(map)
  });

  if (OSM.preferred_editor === "remote" && document.location.pathname === "/edit") {
    remoteEditHandler(map.getBounds(), params.object);
    OSM.router.setCurrentPath("/");
  }

  OSM.router.load();

  $(document).on("click", "a", function(e) {
    if (e.isDefaultPrevented() || e.isPropagationStopped())
      return;

    // Open links in a new tab as normal.
    if (e.which > 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;

    // Ignore cross-protocol and cross-origin links.
    if (location.protocol !== this.protocol || location.host !== this.host)
      return;

    if (OSM.router.route(this.pathname + this.search + this.hash))
      e.preventDefault();
  });
});
L.OSM.sidebar = function(selector) {
  var control = {},
    sidebar = $(selector),
    current = $(),
    currentButton  = $(),
    map;

  control.addTo = function (_) {
    map = _;
    return control;
  };

  control.addPane = function(pane) {
    pane
      .hide()
      .appendTo(sidebar);
  };

  control.togglePane = function(pane, button) {
    current
      .hide()
      .trigger('hide');

    currentButton
      .removeClass('active');

    if (current === pane) {
      $(sidebar).hide();
      current = currentButton = $();
    } else {
      $(sidebar).show();
      current = pane;
      currentButton = button || $();
    }

    map.invalidateSize({pan: false, animate: false});

    current
      .show()
      .trigger('show');

    currentButton
      .addClass('active');
  };

  return control;
};
/*
Copyright (c) 2014 Dominik Moritz

This file is part of the leaflet locate control. It is licensed under the MIT license.
You can find the project at: https://github.com/domoritz/leaflet-locatecontrol
*/

L.Control.Locate = L.Control.extend({
    options: {
        position: 'topleft',
        drawCircle: true,
        follow: false,  // follow with zoom and pan the user's location
        stopFollowingOnDrag: false, // if follow is true, stop following when map is dragged (deprecated)
        // range circle
        circleStyle: {
            color: '#136AEC',
            fillColor: '#136AEC',
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.5
        },
        // inner marker
        markerStyle: {
            color: '#136AEC',
            fillColor: '#2A93EE',
            fillOpacity: 0.7,
            weight: 2,
            opacity: 0.9,
            radius: 5
        },
        // changes to range circle and inner marker while following
        // it is only necessary to provide the things that should change
        followCircleStyle: {},
        followMarkerStyle: {
            //color: '#FFA500',
            //fillColor: '#FFB000'
        },
        icon: 'icon-location',  // icon-location or icon-direction
        iconLoading: 'icon-spinner animate-spin',
        circlePadding: [0, 0],
        metric: true,
        onLocationError: function(err) {
            // this event is called in case of any location error
            // that is not a time out error.
            alert(err.message);
        },
        onLocationOutsideMapBounds: function(control) {
            // this event is repeatedly called when the location changes
            control.stopLocate();
            alert(context.options.strings.outsideMapBoundsMsg);
        },
        setView: true, // automatically sets the map view to the user's location
        // keep the current map zoom level when displaying the user's location. (if 'false', use maxZoom)
        keepCurrentZoomLevel: false,
        strings: {
            title: "Show me where I am",
            popup: "You are within {distance} {unit} from this point",
            outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
        },
        locateOptions: {
            maxZoom: Infinity,
            watch: true  // if you overwrite this, visualization cannot be updated
        }
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'control-locate');

        var self = this;
        this._layer = new L.LayerGroup();
        this._layer.addTo(map);
        this._event = undefined;

        this._locateOptions = this.options.locateOptions;
        L.extend(this._locateOptions, this.options.locateOptions);
        L.extend(this._locateOptions, {
            setView: false // have to set this to false because we have to
                           // do setView manually
        });

        // extend the follow marker style and circle from the normal style
        var tmp = {};
        L.extend(tmp, this.options.markerStyle, this.options.followMarkerStyle);
        this.options.followMarkerStyle = tmp;
        tmp = {};
        L.extend(tmp, this.options.circleStyle, this.options.followCircleStyle);
        this.options.followCircleStyle = tmp;

        var link = L.DomUtil.create('a', 'control-button ' + this.options.icon, container);
        link.innerHTML = "<span class='icon geolocate'></span>";
        link.href = '#';
        link.title = this.options.strings.title;

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', function() {
                if (self._active && (self._event === undefined || map.getBounds().contains(self._event.latlng) || !self.options.setView ||
                    isOutsideMapBounds())) {
                    stopLocate();
                } else {
                    locate();
                }
            })
            .on(link, 'dblclick', L.DomEvent.stopPropagation);

        var locate = function () {
            if (self.options.setView) {
                self._locateOnNextLocationFound = true;
            }
            if(!self._active) {
                map.locate(self._locateOptions);
            }
            self._active = true;
            if (self.options.follow) {
                startFollowing();
            }
            if (!self._event) {
                setClasses('requesting');
            } else {
                visualizeLocation();
            }
        };

        var onLocationFound = function (e) {
            // no need to do anything if the location has not changed
            if (self._event &&
                (self._event.latlng.lat === e.latlng.lat &&
                 self._event.latlng.lng === e.latlng.lng &&
                 self._event.accuracy === e.accuracy)) {
                return;
            }

            if (!self._active) {
                return;
            }

            self._event = e;

            if (self.options.follow && self._following) {
                self._locateOnNextLocationFound = true;
            }

            visualizeLocation();
        };

        var startFollowing = function() {
            map.fire('startfollowing', self);
            self._following = true;
            if (self.options.stopFollowingOnDrag) {
                map.on('dragstart', stopFollowing);
            }
        };

        var stopFollowing = function() {
            map.fire('stopfollowing', self);
            self._following = false;
            if (self.options.stopFollowingOnDrag) {
                map.off('dragstart', stopFollowing);
            }
            visualizeLocation();
        };

        var isOutsideMapBounds = function () {
            if (self._event === undefined)
                return false;
            return map.options.maxBounds &&
                !map.options.maxBounds.contains(self._event.latlng);
        };

        var visualizeLocation = function() {
            if (self._event.accuracy === undefined)
                self._event.accuracy = 0;

            var radius = self._event.accuracy;
            if (self._locateOnNextLocationFound) {
                if (isOutsideMapBounds()) {
                    self.options.onLocationOutsideMapBounds(self);
                } else {
                    map.fitBounds(self._event.bounds, {
                        padding: self.options.circlePadding,
                        maxZoom: self.options.keepCurrentZoomLevel ? map.getZoom() : self._locateOptions.maxZoom
                    });
                }
                self._locateOnNextLocationFound = false;
            }

            // circle with the radius of the location's accuracy
            var style, o;
            if (self.options.drawCircle) {
                if (self._following) {
                    style = self.options.followCircleStyle;
                } else {
                    style = self.options.circleStyle;
                }

                if (!self._circle) {
                    self._circle = L.circle(self._event.latlng, radius, style)
                        .addTo(self._layer);
                } else {
                    self._circle.setLatLng(self._event.latlng).setRadius(radius);
                    for (o in style) {
                        self._circle.options[o] = style[o];
                    }
                }
            }

            var distance, unit;
            if (self.options.metric) {
                distance = radius.toFixed(0);
                unit = "meters";
            } else {
                distance = (radius * 3.2808399).toFixed(0);
                unit = "feet";
            }

            // small inner marker
            var mStyle;
            if (self._following) {
                mStyle = self.options.followMarkerStyle;
            } else {
                mStyle = self.options.markerStyle;
            }

            var t = self.options.strings.popup;
            if (!self._circleMarker) {
                self._circleMarker = L.circleMarker(self._event.latlng, mStyle)
                    .bindPopup(L.Util.template(t, {distance: distance, unit: unit}))
                    .addTo(self._layer);
            } else {
                self._circleMarker.setLatLng(self._event.latlng)
                    .bindPopup(L.Util.template(t, {distance: distance, unit: unit}))
                    ._popup.setLatLng(self._event.latlng);
                for (o in mStyle) {
                    self._circleMarker.options[o] = mStyle[o];
                }
            }

            if (!self._container)
                return;
            if (self._following) {
                setClasses('following');
            } else {
                setClasses('active');
            }
        };

        var setClasses = function(state) {
            if (state == 'requesting') {
                L.DomUtil.removeClasses(self._container, "active following");
                L.DomUtil.addClasses(self._container, "requesting");

                L.DomUtil.removeClasses(link, self.options.icon);
                L.DomUtil.addClasses(link, self.options.iconLoading);
            } else if (state == 'active') {
                L.DomUtil.removeClasses(self._container, "requesting following");
                L.DomUtil.addClasses(self._container, "active");

                L.DomUtil.removeClasses(link, self.options.iconLoading);
                L.DomUtil.addClasses(link, self.options.icon);
            } else if (state == 'following') {
                L.DomUtil.removeClasses(self._container, "requesting");
                L.DomUtil.addClasses(self._container, "active following");

                L.DomUtil.removeClasses(link, self.options.iconLoading);
                L.DomUtil.addClasses(link, self.options.icon);
            }
        }

        var resetVariables = function() {
            self._active = false;
            self._locateOnNextLocationFound = self.options.setView;
            self._following = false;
        };

        resetVariables();

        var stopLocate = function() {
            map.stopLocate();
            map.off('dragstart', stopFollowing);
            if (self.options.follow && self._following) {
                stopFollowing();
            }

            L.DomUtil.removeClass(self._container, "requesting");
            L.DomUtil.removeClass(self._container, "active");
            L.DomUtil.removeClass(self._container, "following");
            resetVariables();

            self._layer.clearLayers();
            self._circleMarker = undefined;
            self._circle = undefined;
        };

        var onLocationError = function (err) {
            // ignore time out error if the location is watched
            if (err.code == 3 && self._locateOptions.watch) {
                return;
            }

            stopLocate();
            self.options.onLocationError(err);
        };

        // event hooks
        map.on('locationfound', onLocationFound, self);
        map.on('locationerror', onLocationError, self);

        // make locate functions available to outside world
        this.locate = locate;
        this.stopLocate = stopLocate;
        this.stopFollowing = stopFollowing;

        return container;
    }
});

L.Map.addInitHook(function () {
    if (this.options.locateControl) {
        this.locateControl = L.control.locate();
        this.addControl(this.locateControl);
    }
});

L.control.locate = function (options) {
    return new L.Control.Locate(options);
};

(function(){
  // leaflet.js raises bug when trying to addClass / removeClass multiple classes at once
  // Let's create a wrapper on it which fixes it.
  var LDomUtilApplyClassesMethod = function(method, element, classNames) {
    classNames = classNames.split(' ');
    classNames.forEach(function(className) {
        L.DomUtil[method].call(this, element, className);
    });
  };

  L.DomUtil.addClasses = function(el, names) { LDomUtilApplyClassesMethod('addClass', el, names); }
  L.DomUtil.removeClasses = function(el, names) { LDomUtilApplyClassesMethod('removeClass', el, names); }
})();
L.OSM.layers = function(options) {
  var control = L.control(options);

  control.onAdd = function (map) {
    var layers = options.layers;

    var $container = $('<div>')
      .attr('class', 'control-layers');

    var button = $('<a>')
      .attr('class', 'control-button')
      .attr('href', '#')
      .attr('title', I18n.t('javascripts.map.layers.title'))
      .html('<span class="icon layers"></span>')
      .on('click', toggle)
      .appendTo($container);

    var $ui = $('<div>')
      .attr('class', 'layers-ui');

    $('<div>')
      .attr('class', 'sidebar_heading')
      .appendTo($ui)
      .append(
        $('<span>')
          .text(I18n.t('javascripts.close'))
          .attr('class', 'icon close')
          .bind('click', toggle))
      .append(
        $('<h4>')
          .text(I18n.t('javascripts.map.layers.header')));

    var baseSection = $('<div>')
      .attr('class', 'section base-layers')
      .appendTo($ui);

    var baseLayers = $('<ul>')
      .appendTo(baseSection);

    layers.forEach(function(layer) {
      var item = $('<li>')
        .appendTo(baseLayers);

      if (map.hasLayer(layer)) {
        item.addClass('active');
      }

      var div = $('<div>')
        .appendTo(item);

      map.whenReady(function() {
        var miniMap = L.map(div[0], {attributionControl: false, zoomControl: false})
          .addLayer(new layer.constructor());

        miniMap.dragging.disable();
        miniMap.touchZoom.disable();
        miniMap.doubleClickZoom.disable();
        miniMap.scrollWheelZoom.disable();

        $ui
          .on('show', shown)
          .on('hide', hide);

        function shown() {
          miniMap.invalidateSize();
          setView({animate: false});
          map.on('moveend', moved);
        }

        function hide() {
          map.off('moveend', moved);
        }

        function moved() {
          setView();
        }

        function setView(options) {
          miniMap.setView(map.getCenter(), Math.max(map.getZoom() - 2, 0), options);
        }
      });

      var label = $('<label>')
        .appendTo(item);

      var input = $('<input>')
         .attr('type', 'radio')
         .prop('checked', map.hasLayer(layer))
         .appendTo(label);

      label.append(layer.options.name);

      item.on('click', function() {
        layers.forEach(function(other) {
          if (other === layer) {
            map.addLayer(other);
          } else {
            map.removeLayer(other);
          }
        });
        map.fire('baselayerchange', {layer: layer});
      });

      map.on('layeradd layerremove', function() {
        item.toggleClass('active', map.hasLayer(layer));
        input.prop('checked', map.hasLayer(layer));
      });
    });

    if (OSM.STATUS !== 'api_offline' && OSM.STATUS !== 'database_offline') {
      var overlaySection = $('<div>')
        .attr('class', 'section overlay-layers')
        .appendTo($ui);

      $('<p>')
        .text(I18n.t('javascripts.map.layers.overlays'))
        .attr("class", "deemphasize")
        .appendTo(overlaySection);

      var overlays = $('<ul>')
        .appendTo(overlaySection);

      var addOverlay = function (layer, name, maxArea) {
        var item = $('<li>')
          .tooltip({
            placement: 'top'
          })
          .appendTo(overlays);

        var label = $('<label>')
          .appendTo(item);

        var checked = map.hasLayer(layer);

        var input = $('<input>')
          .attr('type', 'checkbox')
          .prop('checked', checked)
          .appendTo(label);

        label.append(I18n.t('javascripts.map.layers.' + name));

        input.on('change', function() {
          checked = input.is(':checked');
          if (checked) {
            map.addLayer(layer);
          } else {
            map.removeLayer(layer);
          }
          map.fire('overlaylayerchange', {layer: layer});
        });

        map.on('layeradd layerremove', function() {
          input.prop('checked', map.hasLayer(layer));
        });

        map.on('zoomend', function() {
          var disabled = map.getBounds().getSize() >= maxArea;
          $(input).prop('disabled', disabled);

          if (disabled && $(input).is(':checked')) {
            $(input).prop('checked', false)
              .trigger('change');
            checked = true;
          } else if (!disabled && !$(input).is(':checked') && checked) {
            $(input).prop('checked', true)
              .trigger('change');
          }

          $(item).attr('class', disabled ? 'disabled' : '');
          item.attr('data-original-title', disabled ?
            I18n.t('javascripts.site.map_' + name + '_zoom_in_tooltip') : '');
        });
      };

      addOverlay(map.noteLayer, 'notes', OSM.MAX_NOTE_REQUEST_AREA);
      addOverlay(map.dataLayer, 'data', OSM.MAX_REQUEST_AREA);
    }

    options.sidebar.addPane($ui);

    function toggle(e) {
      e.stopPropagation();
      e.preventDefault();
      options.sidebar.togglePane($ui, button);
      $('.leaflet-control .control-button').tooltip('hide');
    }

    return $container[0];
  };

  return control;
};
L.OSM.key = function (options) {
  var control = L.control(options);

  control.onAdd = function (map) {
    var $container = $('<div>')
      .attr('class', 'control-key');

    var button = $('<a>')
      .attr('class', 'control-button')
      .attr('href', '#')
      .html('<span class="icon key"></span>')
      .on('click', toggle)
      .appendTo($container);

    var $ui = $('<div>')
      .attr('class', 'key-ui');

    $('<div>')
      .attr('class', 'sidebar_heading')
      .appendTo($ui)
      .append(
        $('<span>')
          .text(I18n.t('javascripts.close'))
          .attr('class', 'icon close')
          .bind('click', toggle))
      .append(
        $('<h4>')
          .text(I18n.t('javascripts.key.title')));

    var $section = $('<div>')
      .attr('class', 'section')
      .appendTo($ui);

    options.sidebar.addPane($ui);

    $ui
      .on('show', shown)
      .on('hide', hidden);

    map.on('baselayerchange', updateButton);

    updateButton();

    function shown() {
      map.on('zoomend baselayerchange', update);
      $section.load('/key', update);
    }

    function hidden() {
      map.off('zoomend baselayerchange', update);
    }

    function toggle(e) {
      e.stopPropagation();
      e.preventDefault();
      if (!button.hasClass('disabled')) {
        options.sidebar.togglePane($ui, button);
      }
      $('.leaflet-control .control-button').tooltip('hide');
    }

    function updateButton() {
      var disabled = map.getMapBaseLayerId() !== 'mapnik';
      button
        .toggleClass('disabled', disabled)
        .attr('data-original-title',
              I18n.t(disabled ?
                     'javascripts.key.tooltip_disabled' :
                     'javascripts.key.tooltip'));
    }

    function update() {
      var layer = map.getMapBaseLayerId(),
        zoom = map.getZoom();

      $('.mapkey-table-entry').each(function () {
        var data = $(this).data();
        if (layer === data.layer && zoom >= data.zoomMin && zoom <= data.zoomMax) {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    }

    return $container[0];
  };

  return control;
};
L.OSM.note = function (options) {
  var control = L.control(options);

  control.onAdd = function (map) {
    var $container = $('<div>')
      .attr('class', 'control-note');

    var link = $('<a>')
      .attr('class', 'control-button')
      .attr('href', '#')
      .html('<span class="icon note"></span>')
      .appendTo($container);

    map.on('zoomend', update);

    function update() {
      var disabled = OSM.STATUS === "database_offline" || map.getZoom() < 12;
      link
        .toggleClass('disabled', disabled)
        .attr('data-original-title', I18n.t(disabled ?
          'javascripts.site.createnote_disabled_tooltip' :
          'javascripts.site.createnote_tooltip'));
    }

    update();

    return $container[0];
  };

  return control;
};
L.OSM.share = function (options) {
  var control = L.control(options),
    marker = L.marker([0, 0], {draggable: true}),
    locationFilter = new L.LocationFilter({
      enableButton: false,
      adjustButton: false
    });

  control.onAdd = function (map) {
    var $container = $('<div>')
      .attr('class', 'control-share');

    var button = $('<a>')
      .attr('class', 'control-button')
      .attr('href', '#')
      .attr('title', I18n.t('javascripts.share.title'))
      .html('<span class="icon share"></span>')
      .on('click', toggle)
      .appendTo($container);

    var $ui = $('<div>')
      .attr('class', 'share-ui');

    $('<div>')
      .attr('class', 'sidebar_heading')
      .appendTo($ui)
      .append(
        $('<span>')
          .text(I18n.t('javascripts.close'))
          .attr('class', 'icon close')
          .bind('click', toggle))
      .append(
        $('<h4>')
          .text(I18n.t('javascripts.share.title')));

    // Link / Embed

    var $linkSection = $('<div>')
      .attr('class', 'section share-link')
      .appendTo($ui);

    $('<h4>')
      .text(I18n.t('javascripts.share.link'))
      .appendTo($linkSection);

    var $form = $('<form>')
      .attr('class', 'standard-form')
      .appendTo($linkSection);

    $('<div>')
      .attr('class', 'form-row')
      .appendTo($form)
      .append(
        $('<label>')
          .attr('for', 'link_marker')
          .append(
            $('<input>')
              .attr('id', 'link_marker')
              .attr('type', 'checkbox')
              .bind('change', toggleMarker))
          .append(I18n.t('javascripts.share.include_marker')));

    $('<div>')
      .attr('class', 'share-tabs')
      .appendTo($form)
      .append($('<a>')
        .attr('class', 'active')
        .attr('for', 'long_input')
        .attr('id', 'long_link')
        .text(I18n.t('javascripts.share.long_link')))
      .append($('<a>')
        .attr('for', 'short_input')
        .attr('id', 'short_link')
        .text(I18n.t('javascripts.share.short_link')))
      .append($('<a>')
        .attr('for', 'embed_html')
        .attr('href', '#')
        .text(I18n.t('javascripts.share.embed')))
      .on('click', 'a', function(e) {
        e.preventDefault();
        var id = '#' + $(this).attr('for');
        $linkSection.find('.share-tabs a')
          .removeClass('active');
        $(this).addClass('active');
        $linkSection.find('.share-tab')
          .hide();
        $linkSection.find('.share-tab:has(' + id + ')')
          .show()
          .find('input, textarea')
          .select();
      });

    $('<div>')
      .attr('class', 'form-row share-tab')
      .css('display', 'block')
      .appendTo($form)
      .append($('<input>')
        .attr('id', 'long_input')
        .attr('type', 'text')
        .on('click', select));

    $('<div>')
      .attr('class', 'form-row share-tab')
      .appendTo($form)
      .append($('<input>')
        .attr('id', 'short_input')
        .attr('type', 'text')
        .on('click', select));

    $('<div>')
      .attr('class', 'form-row share-tab')
      .appendTo($form)
      .append(
        $('<textarea>')
          .attr('id', 'embed_html')
          .on('click', select))
      .append(
        $('<p>')
          .attr('class', 'deemphasize')
          .text(I18n.t('javascripts.share.paste_html'))
          .appendTo($linkSection));

    // Image

    var $imageSection = $('<div>')
      .attr('class', 'section share-image')
      .appendTo($ui);

    $('<h4>')
      .text(I18n.t('javascripts.share.image'))
      .appendTo($imageSection);

    $form = $('<form>')
      .attr('class', 'standard-form')
      .attr('action', '/export/finish')
      .attr('method', 'post')
      .appendTo($imageSection);

    $('<div>')
      .attr('class', 'form-row')
      .appendTo($form)
      .append(
        $('<label>')
          .attr('for', 'image_filter')
          .append(
            $('<input>')
              .attr('id', 'image_filter')
              .attr('type', 'checkbox')
              .bind('change', toggleFilter))
          .append(I18n.t('javascripts.share.custom_dimensions')));

    $('<div>')
      .attr('class', 'form-row')
      .appendTo($form)
      .append(
        $('<label>')
          .attr('for', 'mapnik_format')
          .text(I18n.t('javascripts.share.format')))
      .append($('<select>')
        .attr('name', 'mapnik_format')
        .attr('id', 'mapnik_format')
        .append($('<option>').val('png').text('PNG').prop('selected', true))
        .append($('<option>').val('jpeg').text('JPEG'))
        .append($('<option>').val('svg').text('SVG'))
        .append($('<option>').val('pdf').text('PDF')));

    $('<div>')
      .attr('class', 'form-row')
      .appendTo($form)
      .append($('<label>')
        .attr('for', 'mapnik_scale')
        .text(I18n.t('javascripts.share.scale')))
      .append('1 : ')
      .append($('<input>')
        .attr('name', 'mapnik_scale')
        .attr('id', 'mapnik_scale')
        .attr('type', 'text')
        .on('change', update));

    ['minlon', 'minlat', 'maxlon', 'maxlat'].forEach(function(name) {
      $('<input>')
        .attr('id', 'mapnik_' + name)
        .attr('name', name)
        .attr('type', 'hidden')
        .appendTo($form);
    });

    $('<input>')
      .attr('name', 'format')
      .attr('value', 'mapnik')
      .attr('type', 'hidden')
      .appendTo($form);

    $('<p>')
      .attr('class', 'deemphasize')
      .html(I18n.t('javascripts.share.image_size') + ' <span id="mapnik_image_width"></span> x <span id="mapnik_image_height"></span>')
      .appendTo($form);

    $('<input>')
      .attr('type', 'submit')
      .attr('value', I18n.t('javascripts.share.download'))
      .appendTo($form);

    locationFilter
      .on('change', update)
      .addTo(map);

    marker.on('dragend', movedMarker);
    map.on('move', movedMap);
    map.on('moveend layeradd layerremove', update);

    options.sidebar.addPane($ui);

    $ui
      .on('hide', hidden);

    function hidden() {
      map.removeLayer(marker);
      map.options.scrollWheelZoom = map.options.doubleClickZoom = true;
      locationFilter.disable();
      update();
    }

    function toggle(e) {
      e.stopPropagation();
      e.preventDefault();

      $('#mapnik_scale').val(getScale());
      marker.setLatLng(map.getCenter());

      update();
      options.sidebar.togglePane($ui, button);
      $('.leaflet-control .control-button').tooltip('hide');
    }

    function toggleMarker() {
      if ($(this).is(':checked')) {
        marker.setLatLng(map.getCenter());
        map.addLayer(marker);
        map.options.scrollWheelZoom = map.options.doubleClickZoom = 'center';
      } else {
        map.removeLayer(marker);
        map.options.scrollWheelZoom = map.options.doubleClickZoom = true;
      }
      update();
    }

    function toggleFilter() {
      if ($(this).is(':checked')) {
        locationFilter.setBounds(map.getBounds().pad(-0.2));
        locationFilter.enable();
      } else {
        locationFilter.disable();
      }
      update();
    }

    function movedMap() {
      marker.setLatLng(map.getCenter());
      update();
    }

    function movedMarker() {
      if (map.hasLayer(marker)) {
        map.off('move', movedMap);
        map.on('moveend', updateOnce);
        map.panTo(marker.getLatLng());
      }
    }

    function updateOnce() {
      map.off('moveend', updateOnce);
      map.on('move', movedMap);
      update();
    }

    function escapeHTML(string) {
      var htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return string === null ? '' : (string + '').replace(/[&<>"']/g, function(match) {
        return htmlEscapes[match];
      });
    }

    function update() {
      var bounds = map.getBounds();

      $('#link_marker')
        .prop('checked', map.hasLayer(marker));

      $('#image_filter')
        .prop('checked', locationFilter.isEnabled());

      // Link / Embed

      $('#short_input').val(map.getShortUrl(marker));
      $('#long_input').val(map.getUrl(marker));
      $('#short_link').attr('href', map.getShortUrl(marker));
      $('#long_link').attr('href', map.getUrl(marker));

      var params = {
        bbox: bounds.toBBoxString(),
        layer: map.getMapBaseLayerId()
      };

      if (map.hasLayer(marker)) {
        var latLng = marker.getLatLng().wrap();
        params.marker = latLng.lat + ',' + latLng.lng;
      }

      $('#embed_html').val(
        '<iframe width="425" height="350" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="' +
          escapeHTML('http://' + OSM.SERVER_URL + '/export/embed.html?' + $.param(params)) +
          '" style="border: 1px solid black"></iframe><br/>' +
          '<small><a href="' + escapeHTML(map.getUrl(marker)) + '">' +
          escapeHTML(I18n.t('javascripts.share.view_larger_map')) + '</a></small>');

      // Image

      if (locationFilter.isEnabled()) {
        bounds = locationFilter.getBounds();
      }

      var scale = $("#mapnik_scale").val(),
        size = L.bounds(L.CRS.EPSG3857.project(bounds.getSouthWest()),
                        L.CRS.EPSG3857.project(bounds.getNorthEast())).getSize(),
        maxScale = Math.floor(Math.sqrt(size.x * size.y / 0.3136));

      $('#mapnik_minlon').val(bounds.getWest());
      $('#mapnik_minlat').val(bounds.getSouth());
      $('#mapnik_maxlon').val(bounds.getEast());
      $('#mapnik_maxlat').val(bounds.getNorth());

      if (scale < maxScale) {
        scale = roundScale(maxScale);
        $("#mapnik_scale").val(scale);
      }

      $("#mapnik_image_width").text(Math.round(size.x / scale / 0.00028));
      $("#mapnik_image_height").text(Math.round(size.y / scale / 0.00028));
    }

    function select() {
      $(this).select();
    }

    function getScale() {
      var bounds = map.getBounds(),
        centerLat = bounds.getCenter().lat,
        halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
        meters = halfWorldMeters * (bounds.getEast() - bounds.getWest()) / 180,
        pixelsPerMeter = map.getSize().x / meters,
        metersPerPixel = 1 / (92 * 39.3701);
      return Math.round(1 / (pixelsPerMeter * metersPerPixel));
    }

    function roundScale(scale) {
      var precision = 5 * Math.pow(10, Math.floor(Math.LOG10E * Math.log(scale)) - 2);
      return precision * Math.ceil(scale / precision);
    }

    return $container[0];
  };

  return control;
};
/*
 * Utility functions to decode/encode numbers and array's of numbers
 * to/from strings (Google maps polyline encoding)
 *
 * Extends the L.Polyline and L.Polygon object with methods to convert
 * to and create from these strings.
 *
 * Jan Pieter Waagmeester <jieter@jieter.nl>
 *
 * Original code from:
 * http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/
 * (which is down as of december 2014)
 */


(function () {
	'use strict';

	var defaultOptions = function (options) {
		if (typeof options === 'number') {
			// Legacy
			options = { precision: options };
		} else {
			options = options || {};
		}

		options.precision = options.precision || 5;
		options.factor = options.factor || Math.pow(10, options.precision);
		options.dimension = options.dimension || 2;
		return options;
	};

	var PolylineUtil = {
		encode: function (points, options) {
			options = defaultOptions(options);

			var flatPoints = [];
			for (var i = 0, len = points.length; i < len; ++i) {
				var point = points[i];

				if (options.dimension === 2) {
					flatPoints.push(point.lat || point[0]);
					flatPoints.push(point.lng || point[1]);
				} else {
					for (var dim = 0; dim < options.dimension; ++dim) {
						flatPoints.push(point[dim]);
					}
				}
			}

			return this.encodeDeltas(flatPoints, options);
		},

		decode: function (encoded, options) {
			options = defaultOptions(options);

			var flatPoints = this.decodeDeltas(encoded, options);

			var points = [];
			for (var i = 0, len = flatPoints.length; i + (options.dimension - 1) < len;) {
				var point = [];

				for (var dim = 0; dim < options.dimension; ++dim) {
					point.push(flatPoints[i++]);
				}

				points.push(point);
			}

			return points;
		},

		encodeDeltas: function(numbers, options) {
			options = defaultOptions(options);

			var lastNumbers = [];

			for (var i = 0, len = numbers.length; i < len;) {
				for (var d = 0; d < options.dimension; ++d, ++i) {
					var num = numbers[i];
					var delta = num - (lastNumbers[d] || 0);
					lastNumbers[d] = num;

					numbers[i] = delta;
				}
			}

			return this.encodeFloats(numbers, options);
		},

		decodeDeltas: function(encoded, options) {
			options = defaultOptions(options);

			var lastNumbers = [];

			var numbers = this.decodeFloats(encoded, options);
			for (var i = 0, len = numbers.length; i < len;) {
				for (var d = 0; d < options.dimension; ++d, ++i) {
					numbers[i] = lastNumbers[d] = numbers[i] + (lastNumbers[d] || 0);
				}
			}

			return numbers;
		},

		encodeFloats: function(numbers, options) {
			options = defaultOptions(options);

			for (var i = 0, len = numbers.length; i < len; ++i) {
				numbers[i] = Math.round(numbers[i] * options.factor);
			}

			return this.encodeSignedIntegers(numbers);
		},

		decodeFloats: function(encoded, options) {
			options = defaultOptions(options);

			var numbers = this.decodeSignedIntegers(encoded);
			for (var i = 0, len = numbers.length; i < len; ++i) {
				numbers[i] /= options.factor;
			}

			return numbers;
		},

		/* jshint bitwise:false */

		encodeSignedIntegers: function(numbers) {
			for (var i = 0, len = numbers.length; i < len; ++i) {
				var num = numbers[i];
				numbers[i] = (num < 0) ? ~(num << 1) : (num << 1);
			}

			return this.encodeUnsignedIntegers(numbers);
		},

		decodeSignedIntegers: function(encoded) {
			var numbers = this.decodeUnsignedIntegers(encoded);

			for (var i = 0, len = numbers.length; i < len; ++i) {
				var num = numbers[i];
				numbers[i] = (num & 1) ? ~(num >> 1) : (num >> 1);
			}

			return numbers;
		},

		encodeUnsignedIntegers: function(numbers) {
			var encoded = '';
			for (var i = 0, len = numbers.length; i < len; ++i) {
				encoded += this.encodeUnsignedInteger(numbers[i]);
			}
			return encoded;
		},

		decodeUnsignedIntegers: function(encoded) {
			var numbers = [];

			var current = 0;
			var shift = 0;

			for (var i = 0, len = encoded.length; i < len; ++i) {
				var b = encoded.charCodeAt(i) - 63;

				current |= (b & 0x1f) << shift;

				if (b < 0x20) {
					numbers.push(current);
					current = 0;
					shift = 0;
				} else {
					shift += 5;
				}
			}

			return numbers;
		},

		encodeSignedInteger: function (num) {
			num = (num < 0) ? ~(num << 1) : (num << 1);
			return this.encodeUnsignedInteger(num);
		},

		// This function is very similar to Google's, but I added
		// some stuff to deal with the double slash issue.
		encodeUnsignedInteger: function (num) {
			var value, encoded = '';
			while (num >= 0x20) {
				value = (0x20 | (num & 0x1f)) + 63;
				encoded += (String.fromCharCode(value));
				num >>= 5;
			}
			value = num + 63;
			encoded += (String.fromCharCode(value));

			return encoded;
		}

		/* jshint bitwise:true */
	};

	// Export Node module
	if (typeof module === 'object' && typeof module.exports === 'object') {
		module.exports = PolylineUtil;
	}

	// Inject functionality into Leaflet
	if (typeof L === 'object') {
		if (!(L.Polyline.prototype.fromEncoded)) {
			L.Polyline.fromEncoded = function (encoded, options) {
				return new L.Polyline(PolylineUtil.decode(encoded), options);
			};
		}
		if (!(L.Polygon.prototype.fromEncoded)) {
			L.Polygon.fromEncoded = function (encoded, options) {
				return new L.Polygon(PolylineUtil.decode(encoded), options);
			};
		}

		var encodeMixin = {
			encodePath: function () {
				return PolylineUtil.encode(this.getLatLngs());
			}
		};

		if (!L.Polyline.prototype.encodePath) {
			L.Polyline.include(encodeMixin);
		}
		if (!L.Polygon.prototype.encodePath) {
			L.Polygon.include(encodeMixin);
		}

		L.PolylineUtil = PolylineUtil;
	}
})();
L.OSM.query = function (options) {
  var control = L.control(options);

  control.onAdd = function (map) {
    var $container = $('<div>')
      .attr('class', 'control-query');

    var link = $('<a>')
      .attr('class', 'control-button')
      .attr('href', '#')
      .html('<span class="icon query"></span>')
      .appendTo($container);

    map.on('zoomend', update);

    update();

    function update() {
      var wasDisabled = link.hasClass('disabled'),
        isDisabled = map.getZoom() < 14;
      link
        .toggleClass('disabled', isDisabled)
        .attr('data-original-title', I18n.t(isDisabled ?
          'javascripts.site.queryfeature_disabled_tooltip' :
          'javascripts.site.queryfeature_tooltip'));

      if (isDisabled && !wasDisabled) {
        link.trigger('disabled');
      } else if (wasDisabled && !isDisabled) {
        link.trigger('enabled');
      }
    }

    return $container[0];
  };

  return control;
};
 /*!
 * jQuery Simulate v1.0.0 - simulate browser mouse and keyboard events
 * https://github.com/jquery/jquery-simulate
 *
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: 2014-08-22
 */


;(function( $, undefined ) {

var rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/;

$.fn.simulate = function( type, options ) {
	return this.each(function() {
		new $.simulate( this, type, options );
	});
};

$.simulate = function( elem, type, options ) {
	var method = $.camelCase( "simulate-" + type );

	this.target = elem;
	this.options = options;

	if ( this[ method ] ) {
		this[ method ]();
	} else {
		this.simulateEvent( elem, type, options );
	}
};

$.extend( $.simulate, {

	keyCode: {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		NUMPAD_ADD: 107,
		NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111,
		NUMPAD_ENTER: 108,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_SUBTRACT: 109,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	},

	buttonCode: {
		LEFT: 0,
		MIDDLE: 1,
		RIGHT: 2
	}
});

$.extend( $.simulate.prototype, {

	simulateEvent: function( elem, type, options ) {
		var event = this.createEvent( type, options );
		this.dispatchEvent( elem, type, event, options );
	},

	createEvent: function( type, options ) {
		if ( rkeyEvent.test( type ) ) {
			return this.keyEvent( type, options );
		}

		if ( rmouseEvent.test( type ) ) {
			return this.mouseEvent( type, options );
		}
	},

	mouseEvent: function( type, options ) {
		var event, eventDoc, doc, body;
		options = $.extend({
			bubbles: true,
			cancelable: (type !== "mousemove"),
			view: window,
			detail: 0,
			screenX: 0,
			screenY: 0,
			clientX: 1,
			clientY: 1,
			ctrlKey: false,
			altKey: false,
			shiftKey: false,
			metaKey: false,
			button: 0,
			relatedTarget: undefined
		}, options );

		if ( document.createEvent ) {
			event = document.createEvent( "MouseEvents" );
			event.initMouseEvent( type, options.bubbles, options.cancelable,
				options.view, options.detail,
				options.screenX, options.screenY, options.clientX, options.clientY,
				options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
				options.button, options.relatedTarget || document.body.parentNode );

			// IE 9+ creates events with pageX and pageY set to 0.
			// Trying to modify the properties throws an error,
			// so we define getters to return the correct values.
			if ( event.pageX === 0 && event.pageY === 0 && Object.defineProperty ) {
				eventDoc = event.relatedTarget.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				Object.defineProperty( event, "pageX", {
					get: function() {
						return options.clientX +
							( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
							( doc && doc.clientLeft || body && body.clientLeft || 0 );
					}
				});
				Object.defineProperty( event, "pageY", {
					get: function() {
						return options.clientY +
							( doc && doc.scrollTop || body && body.scrollTop || 0 ) -
							( doc && doc.clientTop || body && body.clientTop || 0 );
					}
				});
			}
		} else if ( document.createEventObject ) {
			event = document.createEventObject();
			$.extend( event, options );
			// standards event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ff974877(v=vs.85).aspx
			// old IE event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ms533544(v=vs.85).aspx
			// so we actually need to map the standard back to oldIE
			event.button = {
				0: 1,
				1: 4,
				2: 2
			}[ event.button ] || ( event.button === -1 ? 0 : event.button );
		}

		return event;
	},

	keyEvent: function( type, options ) {
		var event;
		options = $.extend({
			bubbles: true,
			cancelable: true,
			view: window,
			ctrlKey: false,
			altKey: false,
			shiftKey: false,
			metaKey: false,
			keyCode: 0,
			charCode: undefined
		}, options );

		if ( document.createEvent ) {
			try {
				event = document.createEvent( "KeyEvents" );
				event.initKeyEvent( type, options.bubbles, options.cancelable, options.view,
					options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
					options.keyCode, options.charCode );
			// initKeyEvent throws an exception in WebKit
			// see: http://stackoverflow.com/questions/6406784/initkeyevent-keypress-only-works-in-firefox-need-a-cross-browser-solution
			// and also https://bugs.webkit.org/show_bug.cgi?id=13368
			// fall back to a generic event until we decide to implement initKeyboardEvent
			} catch( err ) {
				event = document.createEvent( "Events" );
				event.initEvent( type, options.bubbles, options.cancelable );
				$.extend( event, {
					view: options.view,
					ctrlKey: options.ctrlKey,
					altKey: options.altKey,
					shiftKey: options.shiftKey,
					metaKey: options.metaKey,
					keyCode: options.keyCode,
					charCode: options.charCode
				});
			}
		} else if ( document.createEventObject ) {
			event = document.createEventObject();
			$.extend( event, options );
		}

		if ( !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() ) || (({}).toString.call( window.opera ) === "[object Opera]") ) {
			event.keyCode = (options.charCode > 0) ? options.charCode : options.keyCode;
			event.charCode = undefined;
		}

		return event;
	},

	dispatchEvent: function( elem, type, event ) {
		if ( elem[ type ] ) {
			elem[ type ]();
		} else if ( elem.dispatchEvent ) {
			elem.dispatchEvent( event );
		} else if ( elem.fireEvent ) {
			elem.fireEvent( "on" + type, event );
		}
	},

	simulateFocus: function() {
		var focusinEvent,
			triggered = false,
			element = $( this.target );

		function trigger() {
			triggered = true;
		}

		element.bind( "focus", trigger );
		element[ 0 ].focus();

		if ( !triggered ) {
			focusinEvent = $.Event( "focusin" );
			focusinEvent.preventDefault();
			element.trigger( focusinEvent );
			element.triggerHandler( "focus" );
		}
		element.unbind( "focus", trigger );
	},

	simulateBlur: function() {
		var focusoutEvent,
			triggered = false,
			element = $( this.target );

		function trigger() {
			triggered = true;
		}

		element.bind( "blur", trigger );
		element[ 0 ].blur();

		// blur events are async in IE
		setTimeout(function() {
			// IE won't let the blur occur if the window is inactive
			if ( element[ 0 ].ownerDocument.activeElement === element[ 0 ] ) {
				element[ 0 ].ownerDocument.body.focus();
			}

			// Firefox won't trigger events if the window is inactive
			// IE doesn't trigger events if we had to manually focus the body
			if ( !triggered ) {
				focusoutEvent = $.Event( "focusout" );
				focusoutEvent.preventDefault();
				element.trigger( focusoutEvent );
				element.triggerHandler( "blur" );
			}
			element.unbind( "blur", trigger );
		}, 1 );
	}
});



/** complex events **/

function findCenter( elem ) {
	var offset,
		document = $( elem.ownerDocument );
	elem = $( elem );
	offset = elem.offset();

	return {
		x: offset.left + elem.outerWidth() / 2 - document.scrollLeft(),
		y: offset.top + elem.outerHeight() / 2 - document.scrollTop()
	};
}

function findCorner( elem ) {
	var offset,
		document = $( elem.ownerDocument );
	elem = $( elem );
	offset = elem.offset();

	return {
		x: offset.left - document.scrollLeft(),
		y: offset.top - document.scrollTop()
	};
}

$.extend( $.simulate.prototype, {
	simulateDrag: function() {
		var i = 0,
			target = this.target,
			options = this.options,
			center = options.handle === "corner" ? findCorner( target ) : findCenter( target ),
			x = Math.floor( center.x ),
			y = Math.floor( center.y ),
			coord = { clientX: x, clientY: y },
			dx = options.dx || ( options.x !== undefined ? options.x - x : 0 ),
			dy = options.dy || ( options.y !== undefined ? options.y - y : 0 ),
			moves = options.moves || 3;

		this.simulateEvent( target, "mousedown", coord );

		for ( ; i < moves ; i++ ) {
			x += dx / moves;
			y += dy / moves;

			coord = {
				clientX: Math.round( x ),
				clientY: Math.round( y )
			};

			this.simulateEvent( target.ownerDocument, "mousemove", coord );
		}

		if ( $.contains( document, target ) ) {
			this.simulateEvent( target, "mouseup", coord );
			this.simulateEvent( target, "click", coord );
		} else {
			this.simulateEvent( document, "mouseup", coord );
		}
	}
});

})( jQuery );

OSM.Search = function(map) {
  $(".search_form input[name=query]").on("input", function(e) {
    if ($(e.target).val() === "") {
      $(".describe_location").fadeIn(100);
    } else {
      $(".describe_location").fadeOut(100);
    }
  });

  $(".search_form a.button.switch_link").on("click", function(e) {
    e.preventDefault();
    var query = $(e.target).parent().parent().find("input[name=query]").val();
    if (query) {
      OSM.router.route("/directions?from=" + encodeURIComponent(query) + OSM.formatHash(map));
    } else {
      OSM.router.route("/directions" + OSM.formatHash(map));
    }
  });

  $(".search_form").on("submit", function(e) {
    e.preventDefault();
    $("header").addClass("closed");
    var query = $(this).find("input[name=query]").val();
    if (query) {
      OSM.router.route("/search?query=" + encodeURIComponent(query) + OSM.formatHash(map));
    } else {
      OSM.router.route("/" + OSM.formatHash(map));
    }
  });

  $(".describe_location").on("click", function(e) {
    e.preventDefault();
    var center = map.getCenter().wrap(),
      precision = OSM.zoomPrecision(map.getZoom());
    OSM.router.route("/search?query=" + encodeURIComponent(
      center.lat.toFixed(precision) + "," + center.lng.toFixed(precision)
    ));
  });

  $("#sidebar_content")
    .on("click", ".search_more a", clickSearchMore)
    .on("click", ".search_results_entry a.set_position", clickSearchResult)
    .on("mouseover", "p.search_results_entry:has(a.set_position)", showSearchResult)
    .on("mouseout", "p.search_results_entry:has(a.set_position)", hideSearchResult)
    .on("mousedown", "p.search_results_entry:has(a.set_position)", function () {
      var moved = false;
      $(this).one("click", function (e) {
        if (!moved && !$(e.target).is('a')) {
          $(this).find("a.set_position").simulate("click", e);
        }
      }).one("mousemove", function () {
        moved = true;
      });
    });

  function clickSearchMore(e) {
    e.preventDefault();
    e.stopPropagation();

    var div = $(this).parents(".search_more");

    $(this).hide();
    div.find(".loader").show();

    $.get($(this).attr("href"), function(data) {
      div.replaceWith(data);
    });
  }

  function showSearchResult() {
    var marker = $(this).data("marker");

    if (!marker) {
      var data = $(this).find("a.set_position").data();

      marker = L.marker([data.lat, data.lon], {icon: OSM.getUserIcon()});

      $(this).data("marker", marker);
    }

    markers.addLayer(marker);

    $(this).closest("li").addClass("selected");
  }

  function hideSearchResult() {
    var marker = $(this).data("marker");

    if (marker) {
      markers.removeLayer(marker);
    }

    $(this).closest("li").removeClass("selected");
  }

  function clickSearchResult(e) {
    var data = $(this).data(),
      center = L.latLng(data.lat, data.lon);

    if (data.minLon && data.minLat && data.maxLon && data.maxLat) {
      map.fitBounds([[data.minLat, data.minLon], [data.maxLat, data.maxLon]]);
    } else {
      map.setView(center, data.zoom);
    }

    // Let clicks to object browser links propagate.
    if (data.type && data.id) return;

    e.preventDefault();
    e.stopPropagation();
  }

  var markers = L.layerGroup().addTo(map);

  var page = {};

  page.pushstate = page.popstate = function(path) {
    var params = querystring.parse(path.substring(path.indexOf('?') + 1));
    $(".search_form input[name=query]").val(params.query);
    OSM.loadSidebarContent(path, page.load);
  };

  page.load = function() {
    $(".search_results_entry").each(function() {
      var entry = $(this);
      $.ajax({
        url: entry.data("href"),
        method: 'GET',
        data: {
          zoom: map.getZoom(),
          minlon: map.getBounds().getWest(),
          minlat: map.getBounds().getSouth(),
          maxlon: map.getBounds().getEast(),
          maxlat: map.getBounds().getNorth()
        },
        success: function(html) {
          entry.html(html);
        }
      });
    });

    return map.getState();
  };

  page.unload = function() {
    markers.clearLayers();
    $(".search_form input[name=query]").val("");
    $(".describe_location").fadeIn(100);
  };

  return page;
};
OSM.initializeBrowse = function (map) {
  var browseBounds;
  var selectedLayer;
  var dataLayer = map.dataLayer;

  dataLayer.setStyle({
    way: {
      weight: 3,
      color: "#000000",
      opacity: 0.4
    },
    area: {
      weight: 3,
      color: "#ff0000"
    },
    node: {
      color: "#00ff00"
    }
  });

  dataLayer.isWayArea = function () {
    return false;
  };

  dataLayer.on("click", function (e) {
    onSelect(e.layer);
  });

  map.on('layeradd', function (e) {
    if (e.layer === dataLayer) {
      map.on("moveend", updateData);
      updateData();
    }
  });

  map.on('layerremove', function (e) {
    if (e.layer === dataLayer) {
      map.off("moveend", updateData);
      $('#browse_status').empty();
    }
  });

  function updateData() {
    var bounds = map.getBounds();
    if (!browseBounds || !browseBounds.contains(bounds)) {
      getData();
    }
  }

  function displayFeatureWarning(count, limit, add, cancel) {
    $('#browse_status').html(
      $("<p class='warning'></p>")
        .text(I18n.t("browse.start_rjs.feature_warning", { num_features: count, max_features: limit }))
        .prepend(
          $("<span class='icon close'></span>")
            .click(cancel))
        .append(
          $("<input type='submit'>")
            .val(I18n.t('browse.start_rjs.load_data'))
            .click(add)));
  }

  var dataLoader;

  function getData() {
    var bounds = map.getBounds();
    var url = "/api/" + OSM.API_VERSION + "/map?bbox=" + bounds.toBBoxString();

    /*
     * Modern browsers are quite happy showing far more than 100 features in
     * the data browser, so increase the limit to 2000 by default, but keep
     * it restricted to 500 for IE8 and 100 for older IEs.
     */
    var maxFeatures = 2000;

    /*@cc_on
      if (navigator.appVersion < 8) {
        maxFeatures = 100;
      } else if (navigator.appVersion < 9) {
        maxFeatures = 500;
      }
    @*/

    if (dataLoader) dataLoader.abort();

    dataLoader = $.ajax({
      url: url,
      success: function (xml) {
        dataLayer.clearLayers();
        selectedLayer = null;

        var features = dataLayer.buildFeatures(xml);

        function addFeatures() {
          $('#browse_status').empty();
          dataLayer.addData(features);
          browseBounds = bounds;
        }

        function cancelAddFeatures() {
          $('#browse_status').empty();
        }

        if (features.length < maxFeatures) {
          addFeatures();
        } else {
          displayFeatureWarning(features.length, maxFeatures, addFeatures, cancelAddFeatures);
        }

        dataLoader = null;
      }
    });
  }

  function onSelect(layer) {
    // Unselect previously selected feature
    if (selectedLayer) {
      selectedLayer.setStyle(selectedLayer.originalStyle);
    }

    // Redraw in selected style
    layer.originalStyle = layer.options;
    layer.setStyle({color: '#0000ff', weight: 8});

    OSM.router.route('/' + layer.feature.type + '/' + layer.feature.id);

    // Stash the currently drawn feature
    selectedLayer = layer;
  }
};
OSM.Export = function(map) {
  var page = {};

  var locationFilter = new L.LocationFilter({
    enableButton: false,
    adjustButton: false
  }).on("change", update);

  function getBounds() {
    return L.latLngBounds(
      L.latLng($("#minlat").val(), $("#minlon").val()),
      L.latLng($("#maxlat").val(), $("#maxlon").val()));
  }

  function boundsChanged() {
    var bounds = getBounds();
    map.fitBounds(bounds);
    locationFilter.setBounds(bounds);
    locationFilter.enable();
    validateControls();
  }

  function enableFilter(e) {
    e.preventDefault();

    $("#drag_box").hide();

    locationFilter.setBounds(map.getBounds().pad(-0.2));
    locationFilter.enable();
    validateControls();
  }

  function update() {
    setBounds(locationFilter.isEnabled() ? locationFilter.getBounds() : map.getBounds());
    validateControls();
  }

  function setBounds(bounds) {
    var precision = OSM.zoomPrecision(map.getZoom());
    $("#minlon").val(bounds.getWest().toFixed(precision));
    $("#minlat").val(bounds.getSouth().toFixed(precision));
    $("#maxlon").val(bounds.getEast().toFixed(precision));
    $("#maxlat").val(bounds.getNorth().toFixed(precision));

    $("#export_overpass").attr("href",
        "http://overpass-api.de/api/map?bbox=" +
        $("#minlon").val() + "," + $("#minlat").val() + "," +
        $("#maxlon").val() + "," + $("#maxlat").val());
  }

  function validateControls() {
    $("#export_osm_too_large").toggle(getBounds().getSize() > OSM.MAX_REQUEST_AREA);
    $("#export_commit").toggle(getBounds().getSize() < OSM.MAX_REQUEST_AREA);
  }

  function checkSubmit(e) {
    if (getBounds().getSize() > OSM.MAX_REQUEST_AREA) e.preventDefault();
  }

  page.pushstate = page.popstate = function(path) {
    $("#export_tab").addClass("current");
    OSM.loadSidebarContent(path, page.load);
  };

  page.load = function() {
    map
      .addLayer(locationFilter)
      .on("moveend", update);

    $("#maxlat, #minlon, #maxlon, #minlat").change(boundsChanged);
    $("#drag_box").click(enableFilter);
    $(".export_form").on("submit", checkSubmit);

    update();
    return map.getState();
  };

  page.unload = function() {
    map
      .removeLayer(locationFilter)
      .off("moveend", update);

    $("#export_tab").removeClass("current");
  };

  return page;
};
OSM.initializeNotes = function (map) {
  var noteLayer = map.noteLayer,
      notes = {};

  var noteIcons = {
    "new": L.icon({
      iconUrl: OSM.NEW_NOTE_MARKER,
      iconSize: [25, 40],
      iconAnchor: [12, 40]
    }),
    "open": L.icon({
      iconUrl: OSM.OPEN_NOTE_MARKER,
      iconSize: [25, 40],
      iconAnchor: [12, 40]
    }),
    "closed": L.icon({
      iconUrl: OSM.CLOSED_NOTE_MARKER,
      iconSize: [25, 40],
      iconAnchor: [12, 40]
    })
  };

  map.on("layeradd", function (e) {
    if (e.layer === noteLayer) {
      loadNotes();
      map.on("moveend", loadNotes);
    }
  }).on("layerremove", function (e) {
    if (e.layer === noteLayer) {
      map.off("moveend", loadNotes);
      noteLayer.clearLayers();
      notes = {};
    }
  });

  noteLayer.on('click', function(e) {
    if (e.layer.id) {
      OSM.router.route('/note/' + e.layer.id);
    }
  });

  function updateMarker(marker, feature) {
    if (marker) {
      marker.setIcon(noteIcons[feature.properties.status]);
    } else {
      marker = L.marker(feature.geometry.coordinates.reverse(), {
        icon: noteIcons[feature.properties.status],
        opacity: 0.8,
        clickable: true
      });
      marker.id = feature.properties.id;
      marker.addTo(noteLayer);
    }
    return marker;
  }

  noteLayer.getLayerId = function(marker) {
    return marker.id;
  };

  var noteLoader;

  function loadNotes() {
    var bounds = map.getBounds();
    var size = bounds.getSize();

    if (size <= OSM.MAX_NOTE_REQUEST_AREA) {
      var url = "/api/" + OSM.API_VERSION + "/notes.json?bbox=" + bounds.toBBoxString();

      if (noteLoader) noteLoader.abort();

      noteLoader = $.ajax({
        url: url,
        success: success
      });
    }

    function success(json) {
      var oldNotes = notes;
      notes = {};
      json.features.forEach(updateMarkers);

      function updateMarkers(feature) {
        var marker = oldNotes[feature.properties.id];
        delete oldNotes[feature.properties.id];
        notes[feature.properties.id] = updateMarker(marker, feature);
      }

      for (var id in oldNotes) {
        noteLayer.removeLayer(oldNotes[id]);
      }

      noteLoader = null;
    }
  }
};

OSM.History = function(map) {
  var page = {};

  $("#sidebar_content")
    .on("click", ".changeset_more a", loadMore)
    .on("mouseover", "[data-changeset]", function () {
      highlightChangeset($(this).data("changeset").id);
    })
    .on("mouseout", "[data-changeset]", function () {
      unHighlightChangeset($(this).data("changeset").id);
    })
    .on("mousedown", "[data-changeset]", function () {
      var moved = false;
      $(this).one("click", function (e) {
        if (!moved && !$(e.target).is('a')) {
          clickChangeset($(this).data("changeset").id, e);
        }
      }).one("mousemove", function () {
        moved = true;
      });
    });

  var group = L.featureGroup()
    .on("mouseover", function (e) {
      highlightChangeset(e.layer.id);
    })
    .on("mouseout", function (e) {
      unHighlightChangeset(e.layer.id);
    })
    .on("click", function (e) {
      clickChangeset(e.layer.id, e);
    });

  group.getLayerId = function(layer) {
    return layer.id;
  };

  function highlightChangeset(id) {
    group.getLayer(id).setStyle({fillOpacity: 0.3});
    $("#changeset_" + id).addClass("selected");
  }

  function unHighlightChangeset(id) {
    group.getLayer(id).setStyle({fillOpacity: 0});
    $("#changeset_" + id).removeClass("selected");
  }

  function clickChangeset(id, e) {
    $("#changeset_" + id).find("a.changeset_id").simulate("click", e);
  }

  function update() {
    var data = {list: '1'};

    if (window.location.pathname === '/history') {
      data.bbox = map.getBounds().wrap().toBBoxString();
    }

    $.ajax({
      url: window.location.pathname,
      method: "GET",
      data: data,
      success: function(html) {
        $('#sidebar_content .changesets').html(html);
        updateMap();
      }
    });

    var feedLink = $('link[type="application/atom+xml"]'),
      feedHref = feedLink.attr('href').split('?')[0];

    feedLink.attr('href', feedHref + '?bbox=' + data.bbox);
  }

  function loadMore(e) {
    e.preventDefault();
    e.stopPropagation();

    var div = $(this).parents(".changeset_more");

    $(this).hide();
    div.find(".loader").show();

    $.get($(this).attr("href"), function(data) {
      div.replaceWith(data);
      updateMap();
    });
  }

  function updateMap() {
    group.clearLayers();

    var changesets = [];

    $("[data-changeset]").each(function () {
      var changeset = $(this).data('changeset');
      if (changeset.bbox) {
        changeset.bounds = L.latLngBounds(
          [changeset.bbox.minlat, changeset.bbox.minlon],
          [changeset.bbox.maxlat, changeset.bbox.maxlon]);
        changesets.push(changeset);
      }
    });

    changesets.sort(function (a, b) {
      return b.bounds.getSize() - a.bounds.getSize();
    });

    for (var i = 0; i < changesets.length; ++i) {
      var changeset = changesets[i],
        rect = L.rectangle(changeset.bounds,
          {weight: 2, color: "#FF9500", opacity: 1, fillColor: "#FFFFBF", fillOpacity: 0});
      rect.id = changeset.id;
      rect.addTo(group);
    }

    if (window.location.pathname !== '/history') {
      var bounds = group.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds);
    }
  }

  page.pushstate = page.popstate = function(path) {
    $("#history_tab").addClass("current");
    OSM.loadSidebarContent(path, page.load);
  };

  page.load = function() {
    map.addLayer(group);

    if (window.location.pathname === '/history') {
      map.on("moveend", update);
    }

    update();
  };

  page.unload = function() {
    map.removeLayer(group);
    map.off("moveend", update);

    $("#history_tab").removeClass("current");
  };

  return page;
};
OSM.Note = function (map) {
  var content = $('#sidebar_content'),
    page = {},
    halo, currentNote;

  var noteIcons = {
    "new": L.icon({
      iconUrl: OSM.NEW_NOTE_MARKER,
      iconSize: [25, 40],
      iconAnchor: [12, 40]
    }),
    "open": L.icon({
      iconUrl: OSM.OPEN_NOTE_MARKER,
      iconSize: [25, 40],
      iconAnchor: [12, 40]
    }),
    "closed": L.icon({
      iconUrl: OSM.CLOSED_NOTE_MARKER,
      iconSize: [25, 40],
      iconAnchor: [12, 40]
    })
  };

  function updateNote(form, method, url) {
    $(form).find("input[type=submit]").prop("disabled", true);

    $.ajax({
      url: url,
      type: method,
      oauth: true,
      data: {text: $(form.text).val()},
      success: function () {
        OSM.loadSidebarContent(window.location.pathname, page.load);
      }
    });
  }

  page.pushstate = page.popstate = function (path) {
    OSM.loadSidebarContent(path, function() {
      initialize(function() {
        var data = $('.details').data(),
          latLng = L.latLng(data.coordinates.split(','));
        if (!map.getBounds().contains(latLng)) moveToNote();        
      });
    });
  };

  page.load = function() {
    initialize(moveToNote);
  };

  function initialize(callback) {
    content.find("input[type=submit]").on("click", function (e) {
      e.preventDefault();
      var data = $(e.target).data();
      updateNote(e.target.form, data.method, data.url);
    });

    content.find("textarea").on("input", function (e) {
      var form = e.target.form;

      if ($(e.target).val() === "") {
        $(form.close).val(I18n.t("javascripts.notes.show.resolve"));
        $(form.comment).prop("disabled", true);
      } else {
        $(form.close).val(I18n.t("javascripts.notes.show.comment_and_resolve"));
        $(form.comment).prop("disabled", false);
      }
    });

    content.find("textarea").val('').trigger("input");

    var data = $('.details').data(),
      latLng = L.latLng(data.coordinates.split(','));

    if (!map.hasLayer(halo)) {
      halo = L.circleMarker(latLng, {
        weight: 2.5,
        radius: 20,
        fillOpacity: 0.5,
        color: "#FF6200"
      });
      map.addLayer(halo);
    }

    if (map.hasLayer(currentNote)) map.removeLayer(currentNote);
    currentNote = L.marker(latLng, {
      icon: noteIcons[data.status],
      opacity: 1,
      clickable: true
    });

    map.addLayer(currentNote);

    if (callback) callback();
  }

  function moveToNote() {
    var data = $('.details').data(),
      latLng = L.latLng(data.coordinates.split(','));

    if (!window.location.hash || window.location.hash.match(/^#?c[0-9]+$/)) {
      OSM.router.withoutMoveListener(function () {
        map.setView(latLng, 15, {reset: true});
      });
    }
  }

  page.unload = function () {
    if (map.hasLayer(halo)) map.removeLayer(halo);
    if (map.hasLayer(currentNote)) map.removeLayer(currentNote);
  };

  return page;
};
OSM.NewNote = function(map) {
  var noteLayer = map.noteLayer,
    content = $('#sidebar_content'),
    page = {},
    addNoteButton = $(".control-note .control-button"),
    newNote,
    halo;

  var noteIcons = {
    "new": L.icon({
      iconUrl: OSM.NEW_NOTE_MARKER,
      iconSize: [25, 40],
      iconAnchor: [12, 40]
    }),
    "open": L.icon({
      iconUrl: OSM.OPEN_NOTE_MARKER,
      iconSize: [25, 40],
      iconAnchor: [12, 40]
    }),
    "closed": L.icon({
      iconUrl: OSM.CLOSED_NOTE_MARKER,
      iconSize: [25, 40],
      iconAnchor: [12, 40]
    })
  };

  addNoteButton.on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if ($(this).hasClass('disabled')) return;

    OSM.router.route('/note/new');
  });

  function createNote(marker, form, url) {
    var location = marker.getLatLng().wrap();

    marker.options.draggable = false;
    marker.dragging.disable();

    $(form).find("input[type=submit]").prop("disabled", true);

    $.ajax({
      url: url,
      type: "POST",
      oauth: true,
      data: {
        lat: location.lat,
        lon: location.lng,
        text: $(form.text).val()
      },
      success: function (feature) {
        noteCreated(feature, marker);
      }
    });

    function noteCreated(feature, marker) {
      content.find("textarea").val("");
      updateMarker(feature);
      newNote = null;
      noteLayer.removeLayer(marker);
      addNoteButton.removeClass("active");
      OSM.router.route('/note/' + feature.properties.id);
    }
  }

  function updateMarker(feature) {
    var marker = L.marker(feature.geometry.coordinates.reverse(), {
      icon: noteIcons[feature.properties.status],
      opacity: 0.9,
      clickable: true
    });
    marker.id = feature.properties.id;
    marker.addTo(noteLayer);
    return marker;
  }

  page.pushstate = page.popstate = function (path) {
    OSM.loadSidebarContent(path, page.load);
  };

  function newHalo(loc, a) {
    if (a === 'dragstart' && map.hasLayer(halo)) {
      map.removeLayer(halo);
    } else {
      if (map.hasLayer(halo)) map.removeLayer(halo);

      halo = L.circleMarker(loc, {
        weight: 2.5,
        radius: 20,
        fillOpacity: 0.5,
        color: "#FF6200"
      });

      map.addLayer(halo);
    }
  }

  page.load = function () {
    if (addNoteButton.hasClass("disabled")) return;
    if (addNoteButton.hasClass("active")) return;

    addNoteButton.addClass("active");

    map.addLayer(noteLayer);

    var mapSize = map.getSize();
    var markerPosition;

    if (mapSize.y > 800) {
      markerPosition = [mapSize.x / 2, mapSize.y / 2];
    } else if (mapSize.y > 400) {
      markerPosition = [mapSize.x / 2, 400];
    } else {
      markerPosition = [mapSize.x / 2, mapSize.y];
    }

    newNote = L.marker(map.containerPointToLatLng(markerPosition), {
      icon: noteIcons["new"],
      opacity: 0.9,
      draggable: true
    });

    newNote.on("dragstart dragend", function(a) {
      newHalo(newNote.getLatLng(), a.type);
    });

    newNote.addTo(noteLayer);
    newHalo(newNote.getLatLng());

    newNote.on("remove", function () {
      addNoteButton.removeClass("active");
    }).on("dragstart",function () {
      $(newNote).stopTime("removenote");
    }).on("dragend", function () {
      content.find("textarea").focus();
    });

    content.find("textarea")
      .on("input", disableWhenBlank)
      .focus();

    function disableWhenBlank(e) {
      $(e.target.form.add).prop("disabled", $(e.target).val() === "");
    }

    content.find('input[type=submit]').on('click', function (e) {
      e.preventDefault();
      createNote(newNote, e.target.form, '/api/0.6/notes.json');
    });

    return map.getState();
  };

  page.unload = function () {
    noteLayer.removeLayer(newNote);
    map.removeLayer(halo);
    addNoteButton.removeClass("active");
  };

  return page;
};



OSM.Directions = function (map) {
  var awaitingGeocode; // true if the user has requested a route, but we're waiting on a geocode result
  var awaitingRoute;   // true if we've asked the engine for a route and are waiting to hear back
  var dragging;        // true if the user is dragging a start/end point
  var chosenEngine;

  var popup = L.popup();

  var polyline = L.polyline([], {
    color: '#03f',
    opacity: 0.3,
    weight: 10
  });

  var highlight = L.polyline([], {
    color: '#ff0',
    opacity: 0.5,
    weight: 12
  });

  var endpoints = [
    Endpoint($("input[name='route_from']"), OSM.MARKER_GREEN),
    Endpoint($("input[name='route_to']"), OSM.MARKER_RED)
  ];

  function Endpoint(input, iconUrl) {
    var endpoint = {};

    endpoint.marker = L.marker([0, 0], {
      icon: L.icon({
        iconUrl: iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: OSM.MARKER_SHADOW,
        shadowSize: [41, 41]
      }),
      draggable: true
    });

    endpoint.marker.on('drag dragend', function (e) {
      dragging = (e.type === 'drag');
      if (dragging && !chosenEngine.draggable) return;
      if (dragging && awaitingRoute) return;
      endpoint.setLatLng(e.target.getLatLng());
      if (map.hasLayer(polyline)) {
        getRoute();
      }
    });

    input.on("change", function (e) {
      // make text the same in both text boxes
      var value = e.target.value;
      endpoint.setValue(value);
    });

    endpoint.setValue = function(value) {
      endpoint.value = value;
      delete endpoint.latlng;
      input.val(value);
      endpoint.getGeocode();
    };

    endpoint.getGeocode = function() {
      // if no one has entered a value yet, then we can't geocode, so don't
      // even try.
      if (!endpoint.value) {
        return;
      }

      endpoint.awaitingGeocode = true;

      $.getJSON(document.location.protocol + OSM.NOMINATIM_URL + 'search?q=' + encodeURIComponent(endpoint.value) + '&format=json', function (json) {
        endpoint.awaitingGeocode = false;
        endpoint.hasGeocode = true;
        if (json.length === 0) {
          alert(I18n.t('javascripts.directions.errors.no_place'));
          return;
        }

        input.val(json[0].display_name);

        endpoint.latlng = L.latLng(json[0]);
        endpoint.marker
          .setLatLng(endpoint.latlng)
          .addTo(map);

        if (awaitingGeocode) {
          awaitingGeocode = false;
          getRoute();
        }
      });
    };

    endpoint.setLatLng = function (ll) {
      var precision = OSM.zoomPrecision(map.getZoom());
      input.val(ll.lat.toFixed(precision) + ", " + ll.lng.toFixed(precision));
      endpoint.hasGeocode = true;
      endpoint.latlng = ll;
      endpoint.marker
        .setLatLng(ll)
        .addTo(map);
    };

    return endpoint;
  }

  $(".directions_form .close").on("click", function(e) {
    e.preventDefault();
    var route_from = endpoints[0].value;
    if (route_from) {
      OSM.router.route("/?query=" + encodeURIComponent(route_from) + OSM.formatHash(map));
    } else {
      OSM.router.route("/" + OSM.formatHash(map));
    }
  });

  function formatDistance(m) {
    if (m < 1000) {
      return Math.round(m) + "m";
    } else if (m < 10000) {
      return (m / 1000.0).toFixed(1) + "km";
    } else {
      return Math.round(m / 1000) + "km";
    }
  }

  function formatTime(s) {
    var m = Math.round(s / 60);
    var h = Math.floor(m / 60);
    m -= h * 60;
    return h + ":" + (m < 10 ? '0' : '') + m;
  }

  function setEngine(id) {
    engines.forEach(function(engine, i) {
      if (engine.id === id) {
        chosenEngine = engine;
        select.val(i);
      }
    });
  }

  function getRoute() {
    // Cancel any route that is already in progress
    if (awaitingRoute) awaitingRoute.abort();

    // go fetch geocodes for any endpoints which have not already
    // been geocoded.
    for (var ep_i = 0; ep_i < 2; ++ep_i) {
      var endpoint = endpoints[ep_i];
      if (!endpoint.hasGeocode && !endpoint.awaitingGeocode) {
        endpoint.getGeocode();
        awaitingGeocode = true;
      }
    }
    if (endpoints[0].awaitingGeocode || endpoints[1].awaitingGeocode) {
      awaitingGeocode = true;
      return;
    }

    var o = endpoints[0].latlng,
        d = endpoints[1].latlng;

    if (!o || !d) return;
    $("header").addClass("closed");

    var precision = OSM.zoomPrecision(map.getZoom());

    OSM.router.replace("/directions?" + querystring.stringify({
      engine: chosenEngine.id,
      route: o.lat.toFixed(precision) + ',' + o.lng.toFixed(precision) + ';' +
             d.lat.toFixed(precision) + ',' + d.lng.toFixed(precision)
    }));

    // copy loading item to sidebar and display it. we copy it, rather than
    // just using it in-place and replacing it in case it has to be used
    // again.
    $('#sidebar_content').html($('.directions_form .loader_copy').html());
    map.setSidebarOverlaid(false);

    awaitingRoute = chosenEngine.getRoute([o, d], function (err, route) {
      awaitingRoute = null;

      if (err) {
        map.removeLayer(polyline);

        if (!dragging) {
          alert(I18n.t('javascripts.directions.errors.no_route'));
        }

        return;
      }

      polyline
        .setLatLngs(route.line)
        .addTo(map);

      if (!dragging) {
        map.fitBounds(polyline.getBounds().pad(0.05));
      }

      var html = '<h2><a class="geolink" href="#">' +
        '<span class="icon close"></span></a>' + I18n.t('javascripts.directions.directions') +
        '</h2><p id="routing_summary">' +
        I18n.t('javascripts.directions.distance') + ': ' + formatDistance(route.distance) + '. ' +
        I18n.t('javascripts.directions.time') + ': ' + formatTime(route.time) + '.</p>' +
        '<table id="turnbyturn" />';

      $('#sidebar_content')
        .html(html);

      // Add each row
      var cumulative = 0;
      route.steps.forEach(function (step) {
        var ll        = step[0],
          direction   = step[1],
          instruction = step[2],
          dist        = step[3],
          lineseg     = step[4];

        cumulative += dist;

        if (dist < 5) {
          dist = "";
        } else if (dist < 200) {
          dist = Math.round(dist / 10) * 10 + "m";
        } else if (dist < 1500) {
          dist = Math.round(dist / 100) * 100 + "m";
        } else if (dist < 5000) {
          dist = Math.round(dist / 100) / 10 + "km";
        } else {
          dist = Math.round(dist / 1000) + "km";
        }

        var row = $("<tr class='turn'/>");
        row.append("<td><div class='direction i" + direction + "'/></td> ");
        row.append("<td class='instruction'>" + instruction);
        row.append("<td class='distance'>" + dist);

        row.on('click', function () {
          popup
            .setLatLng(ll)
            .setContent("<p>" + instruction + "</p>")
            .openOn(map);
        });

        row.hover(function () {
          highlight
            .setLatLngs(lineseg)
            .addTo(map);
        }, function () {
          map.removeLayer(highlight);
        });

        $('#turnbyturn').append(row);
      });

      $('#sidebar_content').append('<p id="routing_credit">' +
        I18n.t('javascripts.directions.instructions.courtesy', {link: chosenEngine.creditline}) +
        '</p>');

      $('#sidebar_content a.geolink').on('click', function(e) {
        e.preventDefault();
        map.removeLayer(polyline);
        $('#sidebar_content').html('');
        map.setSidebarOverlaid(true);
        // TODO: collapse width of sidebar back to previous
      });
    });
  }

  var engines = OSM.Directions.engines;

  engines.sort(function (a, b) {
    a = I18n.t('javascripts.directions.engines.' + a.id);
    b = I18n.t('javascripts.directions.engines.' + b.id);
    return a.localeCompare(b);
  });

  var select = $('select.routing_engines');

  engines.forEach(function(engine, i) {
    select.append("<option value='" + i + "'>" + I18n.t('javascripts.directions.engines.' + engine.id) + "</option>");
  });

  setEngine('osrm_car');

  select.on("change", function (e) {
    chosenEngine = engines[e.target.selectedIndex];
    if (map.hasLayer(polyline)) {
      getRoute();
    }
  });

  $(".directions_form").on("submit", function(e) {
    e.preventDefault();
    getRoute();
  });

  $(".routing_marker").on('dragstart', function (e) {
    e.originalEvent.dataTransfer.effectAllowed = 'move';
    e.originalEvent.dataTransfer.setData('type', $(this).data('type'));
    var img = $("<img>").attr("src", $(e.originalEvent.target).attr("src"));
    e.originalEvent.dataTransfer.setDragImage(img.get(0), 12, 21);
  });

  var page = {};

  page.pushstate = page.popstate = function() {
    $(".search_form").hide();
    $(".directions_form").show();

    $("#map").on('dragend dragover', function (e) {
      e.preventDefault();
    });

    $("#map").on('drop', function (e) {
      e.preventDefault();
      var oe = e.originalEvent;
      var type = oe.dataTransfer.getData('type');
      var pt = L.DomEvent.getMousePosition(oe, map.getContainer());  // co-ordinates of the mouse pointer at present
      pt.y += 20;
      var ll = map.containerPointToLatLng(pt);
      endpoints[type === 'from' ? 0 : 1].setLatLng(ll);
      getRoute();
    });

    var params = querystring.parse(location.search.substring(1)),
      route = (params.route || '').split(';');

    if (params.engine) {
      setEngine(params.engine);
    }

    if (params.from) {
      endpoints[0].setValue(params.from);
      endpoints[1].setValue("");
    } else {
      endpoints[0].setValue("");
      endpoints[1].setValue("");
    }

    var o = route[0] && L.latLng(route[0].split(',')),
        d = route[1] && L.latLng(route[1].split(','));

    if (o) endpoints[0].setLatLng(o);
    if (d) endpoints[1].setLatLng(d);

    map.setSidebarOverlaid(!o || !d);

    getRoute();
  };

  page.load = function() {
    page.pushstate();
  };

  page.unload = function() {
    $(".search_form").show();
    $(".directions_form").hide();
    $("#map").off('dragend dragover drop');

    map
      .removeLayer(popup)
      .removeLayer(polyline)
      .removeLayer(endpoints[0].marker)
      .removeLayer(endpoints[1].marker);
  };

  return page;
};

OSM.Directions.engines = [];

OSM.Directions.addEngine = function (engine, supportsHTTPS) {
  if (document.location.protocol === "http:" || supportsHTTPS) {
    OSM.Directions.engines.push(engine);
  }
};
function GraphHopperEngine(id, vehicleParam) {
  var GH_INSTR_MAP = {
    "-3": 6, // sharp left
    "-2": 7, // left
    "-1": 8, // slight left
    0: 0, // straight
    1: 1, // slight right
    2: 2, // right
    3: 3, // sharp right
    4: -1, // finish reached
    5: -1, // via reached
    6: 11 // roundabout
  };

  return {
    id: id,
    creditline: '<a href="https://graphhopper.com/" target="_blank">Graphhopper</a>',
    draggable: false,

    getRoute: function (points, callback) {
      // GraphHopper Directions API documentation
      // https://github.com/graphhopper/directions-api/blob/master/docs-routing.md
      var url = document.location.protocol + "//graphhopper.com/api/1/route?" +
          vehicleParam +
          "&locale=" + I18n.currentLocale() +
          "&key=LijBPDQGfu7Iiq80w3HzwB4RUDJbMbhs6BU0dEnn" +
          "&type=jsonp" +
          "&elevation=false" +
          "&instructions=true";

      for (var i = 0; i < points.length; i++) {
        url += "&point=" + points[i].lat + ',' + points[i].lng;
      }

      return $.ajax({
        url: url,
        dataType: 'jsonp',
        success: function (data) {
          if (!data.paths || data.paths.length === 0)
            return callback(true);

          var path = data.paths[0];
          var line = L.PolylineUtil.decode(path.points);

          var steps = [];
          var len = path.instructions.length;
          for (var i = 0; i < len; i++) {
            var instr = path.instructions[i];
            var instrCode = (i === len - 1) ? 15 : GH_INSTR_MAP[instr.sign];
            var instrText = "<b>" + (i + 1) + ".</b> ";
            instrText += instr.text;
            var latLng = line[instr.interval[0]];
            var distInMeter = instr.distance;
            steps.push([
              {lat: latLng.lat, lng: latLng.lng},
              instrCode,
              instrText,
              distInMeter,
              []
            ]); // TODO does graphhopper map instructions onto line indices?
          }

          callback(null, {
            line: line,
            steps: steps,
            distance: path.distance,
            time: path.time / 1000
          });
        }
      });
    }
  };
}

OSM.Directions.addEngine(new GraphHopperEngine("graphhopper_bicycle", "vehicle=bike"), true);
OSM.Directions.addEngine(new GraphHopperEngine("graphhopper_foot", "vehicle=foot"), true);
// For docs, see:
// http://developer.mapquest.com/web/products/open/directions-service
// http://open.mapquestapi.com/directions/
// https://github.com/apmon/openstreetmap-website/blob/21edc353a4558006f0ce23f5ec3930be6a7d4c8b/app/controllers/routing_controller.rb#L153

function MapQuestEngine(id, vehicleParam) {
  var MQ_SPRITE_MAP = {
    0: 1, // straight
    1: 2, // slight right
    2: 3, // right
    3: 4, // sharp right
    4: 5, // reverse
    5: 6, // sharp left
    6: 7, // left
    7: 8, // slight left
    8: 5, // right U-turn
    9: 5, // left U-turn
    10: 2, // right merge
    11: 8, // left merge
    12: 2, // right on-ramp
    13: 8, // left on-ramp
    14: 2, // right off-ramp
    15: 8, // left off-ramp
    16: 2, // right fork
    17: 8, // left fork
    18: 1  // straight fork
  };

  return {
    id: id,
    creditline: '<a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="' + document.location.protocol + '//developer.mapquest.com/content/osm/mq_logo.png">',
    draggable: false,

    getRoute: function (points, callback) {
      var url = document.location.protocol + "//open.mapquestapi.com/directions/v2/route?key=Fmjtd%7Cluur290anu%2Crl%3Do5-908a0y";
      var from = points[0];
      var to = points[points.length - 1];
      url += "&from=" + from.lat + ',' + from.lng;
      url += "&to=" + to.lat + ',' + to.lng;
      url += "&" + vehicleParam;
      //url+="&locale=" + I18n.currentLocale(); //Doesn't actually work. MapQuest requires full locale e.g. "de_DE", but I18n may only provides language, e.g. "de"
      url += "&manMaps=false";
      url += "&shapeFormat=raw&generalize=0&unit=k";

      return $.ajax({
        url: url,
        success: function (data) {
          if (data.info.statuscode !== 0)
            return callback(true);

          var i;
          var line = [];
          var shape = data.route.shape.shapePoints;
          for (i = 0; i < shape.length; i += 2) {
            line.push(L.latLng(shape[i], shape[i + 1]));
          }

          // data.route.shape.maneuverIndexes links turns to polyline positions
          // data.route.legs[0].maneuvers is list of turns
          var steps = [];
          var mq = data.route.legs[0].maneuvers;
          for (i = 0; i < mq.length; i++) {
            var s = mq[i];
            var d;
            var linesegstart, linesegend, lineseg;
            linesegstart = data.route.shape.maneuverIndexes[i];
            if (i === mq.length - 1) {
              d = 15;
              linesegend = linesegstart + 1;
            } else {
              d = MQ_SPRITE_MAP[s.turnType];
              linesegend = data.route.shape.maneuverIndexes[i + 1] + 1;
            }
            lineseg = [];
            for (var j = linesegstart; j < linesegend; j++) {
              lineseg.push(L.latLng(data.route.shape.shapePoints[j * 2], data.route.shape.shapePoints[j * 2 + 1]));
            }
            steps.push([L.latLng(s.startPoint.lat, s.startPoint.lng), d, s.narrative, s.distance * 1000, lineseg]);
          }

          callback(null, {
            line: line,
            steps: steps,
            distance: data.route.distance * 1000,
            time: data.route.time
          });
        }
      });
    }
  };
}

OSM.Directions.addEngine(new MapQuestEngine("mapquest_bicycle", "routeType=bicycle"), true);
OSM.Directions.addEngine(new MapQuestEngine("mapquest_foot", "routeType=pedestrian"), true);
OSM.Directions.addEngine(new MapQuestEngine("mapquest_car", "routeType=fastest"), true);
// OSRM car engine
// Doesn't yet support hints

function OSRMEngine() {
  var previousPoints, hintData;

  return {
    id: "osrm_car",
    creditline: '<a href="http://project-osrm.org/" target="_blank">OSRM</a>',
    draggable: true,

    getRoute: function (points, callback) {
      var TURN_INSTRUCTIONS = [
        "",
        I18n.t('javascripts.directions.instructions.continue_on'),      // 1
        I18n.t('javascripts.directions.instructions.slight_right'),     // 2
        I18n.t('javascripts.directions.instructions.turn_right'),       // 3
        I18n.t('javascripts.directions.instructions.sharp_right'),      // 4
        I18n.t('javascripts.directions.instructions.uturn'),            // 5
        I18n.t('javascripts.directions.instructions.sharp_left'),       // 6
        I18n.t('javascripts.directions.instructions.turn_left'),        // 7
        I18n.t('javascripts.directions.instructions.slight_left'),      // 8
        I18n.t('javascripts.directions.instructions.via_point'),        // 9
        I18n.t('javascripts.directions.instructions.follow'),           // 10
        I18n.t('javascripts.directions.instructions.roundabout'),       // 11
        I18n.t('javascripts.directions.instructions.leave_roundabout'), // 12
        I18n.t('javascripts.directions.instructions.stay_roundabout'),  // 13
        I18n.t('javascripts.directions.instructions.start'),            // 14
        I18n.t('javascripts.directions.instructions.destination'),      // 15
        I18n.t('javascripts.directions.instructions.against_oneway'),   // 16
        I18n.t('javascripts.directions.instructions.end_oneway')        // 17
      ];

      var url = document.location.protocol + "//router.project-osrm.org/viaroute?z=14&output=json&instructions=true";

      for (var i = 0; i < points.length; i++) {
        url += "&loc=" + points[i].lat + ',' + points[i].lng;
        if (hintData && previousPoints && previousPoints[i].equals(points[i])) {
          url += "&hint=" + hintData.locations[i];
        }
      }

      if (hintData && hintData.checksum) {
        url += "&checksum=" + hintData.checksum;
      }

      return $.ajax({
        url: url,
        dataType: 'json',
        success: function (data) {
          if (data.status === 207)
            return callback(true);

          previousPoints = points;
          hintData = data.hint_data;

          var line = L.PolylineUtil.decode(data.route_geometry, {
            precision: 6
          });

          var steps = [];
          for (i = 0; i < data.route_instructions.length; i++) {
            var s = data.route_instructions[i];
            var linesegend;
            var instCodes = s[0].split('-');
            var instText = "<b>" + (i + 1) + ".</b> ";
            instText += TURN_INSTRUCTIONS[instCodes[0]];
            if (instCodes[1]) {
              instText += I18n.t('javascripts.directions.instructions.exit', { exit: instCodes[1] } );
            }
            if (instCodes[0] !== 15) {
              instText += " ";
              instText += s[1] ? "<b>" + s[1] + "</b>" : I18n.t('javascripts.directions.instructions.unnamed');
            }
            if ((i + 1) < data.route_instructions.length) {
              linesegend = data.route_instructions[i + 1][3] + 1;
            } else {
              linesegend = s[3] + 1;
            }
            steps.push([line[s[3]], s[0].split('-')[0], instText, s[2], line.slice(s[3], linesegend)]);
          }

          callback(null, {
            line: line,
            steps: steps,
            distance: data.route_summary.total_distance,
            time: data.route_summary.total_time
          });
        }
      });
    }
  };
}

OSM.Directions.addEngine(new OSRMEngine(), true);
OSM.Changeset = function (map) {
  var page = {},
    content = $('#sidebar_content'),
    currentChangesetId;

  page.pushstate = page.popstate = function(path, id) {
    OSM.loadSidebarContent(path, function() {
      page.load(path, id);
    });
  };

  page.load = function(path, id) {
    if(id)
      currentChangesetId = id;
    initialize();
    addChangeset(currentChangesetId, true);
  };

  function addChangeset(id, center) {
    map.addObject({type: 'changeset', id: parseInt(id)}, function(bounds) {
      if (!window.location.hash && bounds.isValid() &&
          (center || !map.getBounds().contains(bounds))) {
        OSM.router.withoutMoveListener(function () {
          map.fitBounds(bounds);
        });
      }
    });
  }

  function updateChangeset(form, method, url, include_data) {
    var data;

    $(form).find("input[type=submit]").prop("disabled", true);

    if(include_data) {
      data = {text: $(form.text).val()};
    } else {
      data = {};
    }

    $.ajax({
      url: url,
      type: method,
      oauth: true,
      data: data,
      success: function () {
        OSM.loadSidebarContent(window.location.pathname, page.load);
      }
    });
  }

  function initialize() {
    content.find("input[name=comment]").on("click", function (e) {
      e.preventDefault();
      var data = $(e.target).data();
      updateChangeset(e.target.form, data.method, data.url, true);
    });

    content.find(".action-button").on("click", function (e) {
      e.preventDefault();
      var data = $(e.target).data();
      updateChangeset(e.target.form, data.method, data.url);
    });

    content.find("textarea").on("input", function (e) {
      var form = e.target.form;

      if ($(e.target).val() === "") {
        $(form.comment).prop("disabled", true);
      } else {
        $(form.comment).prop("disabled", false);
      }
    });

    content.find("textarea").val('').trigger("input");
  }

  page.unload = function() {
    map.removeObject();
  };

  return page;
};

OSM.Query = function(map) {
  var protocol = document.location.protocol === "https:" ? "https:" : "http:",
    url = protocol + OSM.OVERPASS_URL,
    queryButton = $(".control-query .control-button"),
    uninterestingTags = ['source', 'source_ref', 'source:ref', 'history', 'attribution', 'created_by', 'tiger:county', 'tiger:tlid', 'tiger:upload_uuid', 'KSJ2:curve_id', 'KSJ2:lat', 'KSJ2:lon', 'KSJ2:coordinate', 'KSJ2:filename', 'note:ja'],
    marker;

  var featureStyle = {
    color: "#FF6200",
    weight: 4,
    opacity: 1,
    fillOpacity: 0.5,
    clickable: false
  };

  queryButton.on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (queryButton.hasClass("active")) {
      disableQueryMode();
    } else if (!queryButton.hasClass("disabled")) {
      enableQueryMode();
    }
  }).on("disabled", function () {
    if (queryButton.hasClass("active")) {
      map.off("click", clickHandler);
      $(map.getContainer()).removeClass("query-active").addClass("query-disabled");
      $(this).tooltip("show");
    }
  }).on("enabled", function () {
    if (queryButton.hasClass("active")) {
      map.on("click", clickHandler);
      $(map.getContainer()).removeClass("query-disabled").addClass("query-active");
      $(this).tooltip("hide");
    }
  });

  $("#sidebar_content")
    .on("mouseover", ".query-results li.query-result", function () {
      var geometry = $(this).data("geometry");
      if (geometry) map.addLayer(geometry);
      $(this).addClass("selected");
    })
    .on("mouseout", ".query-results li.query-result", function () {
      var geometry = $(this).data("geometry");
      if (geometry) map.removeLayer(geometry);
      $(this).removeClass("selected");
    })
    .on("mousedown", ".query-results li.query-result", function () {
      var moved = false;
      $(this).one("click", function (e) {
        if (!moved) {
          var geometry = $(this).data("geometry");
          if (geometry) map.removeLayer(geometry);

          if (!$(e.target).is('a')) {
            $(this).find("a").simulate("click", e);
          }
        }
      }).one("mousemove", function () {
        moved = true;
      });
    });

  function interestingFeature(feature) {
    if (feature.tags) {
      for (var key in feature.tags) {
        if (uninterestingTags.indexOf(key) < 0) {
          return true;
        }
      }
    }

    return false;
  }

  function featurePrefix(feature) {
    var tags = feature.tags;
    var prefix = "";

    if (tags.boundary === "administrative" && tags.admin_level) {
      prefix = I18n.t("geocoder.search_osm_nominatim.admin_levels.level" + tags.admin_level, {
        defaultValue: I18n.t("geocoder.search_osm_nominatim.prefix.boundary.administrative")
      });
    } else {
      var prefixes = I18n.t("geocoder.search_osm_nominatim.prefix");
      var key, value;

      for (key in tags) {
        value = tags[key];

        if (prefixes[key]) {
          if (prefixes[key][value]) {
            return prefixes[key][value];
          }
        }
      }

      for (key in tags) {
        value = tags[key];

        if (prefixes[key]) {
          var first = value.substr(0, 1).toUpperCase(),
            rest = value.substr(1).replace(/_/g, " ");

          return first + rest;
        }
      }
    }

    if (!prefix) {
      prefix = I18n.t("javascripts.query." + feature.type);
    }

    return prefix;
  }

  function featureName(feature) {
    var tags = feature.tags,
      locales = I18n.locales.get();

    for (var i = 0; i < locales.length; i++) {
      if (tags["name:" + locales[i]]) {
        return tags["name:" + locales[i]];
      }
    }

    if (tags.name) {
      return tags.name;
    } else if (tags.ref) {
      return tags.ref;
    } else if (tags["addr:housename"]) {
      return tags["addr:housename"];
    } else if (tags["addr:housenumber"] && tags["addr:street"]) {
      return tags["addr:housenumber"] + " " + tags["addr:street"];
    } else {
      return "#" + feature.id;
    }
  }

  function featureGeometry(feature) {
    var geometry;

    if (feature.type === "node" && feature.lat && feature.lon) {
      geometry = L.circleMarker([feature.lat, feature.lon], featureStyle);
    } else if (feature.type === "way" && feature.geometry) {
      geometry = L.polyline(feature.geometry.filter(function (point) {
        return point !== null;
      }).map(function (point) {
        return [point.lat, point.lon];
      }), featureStyle);
    } else if (feature.type === "relation" && feature.members) {
      geometry = L.featureGroup(feature.members.map(featureGeometry).filter(function (geometry) {
        return geometry !== undefined;
      }));
    }

    return geometry;
  }

  function runQuery(latlng, radius, query, $section, compare) {
    var $ul = $section.find("ul");

    $ul.empty();
    $section.show();

    $section.find(".loader").oneTime(1000, "loading", function () {
      $(this).show();
    });

    if ($section.data("ajax")) {
      $section.data("ajax").abort();
    }

    $section.data("ajax", $.ajax({
      url: url,
      method: "POST",
      data: {
        data: "[timeout:5][out:json];" + query,
      },
      success: function(results) {
        var elements;

        $section.find(".loader").stopTime("loading").hide();

        if (compare) {
          elements = results.elements.sort(compare);
        } else {
          elements = results.elements;
        }

        for (var i = 0; i < elements.length; i++) {
          var element = elements[i];

          if (interestingFeature(element)) {
            var $li = $("<li>")
              .addClass("query-result")
              .data("geometry", featureGeometry(element))
              .appendTo($ul);
            var $p = $("<p>")
              .text(featurePrefix(element) + " ")
              .appendTo($li);

            $("<a>")
              .attr("href", "/" + element.type + "/" + element.id)
              .text(featureName(element))
              .appendTo($p);
          }
        }

        if ($ul.find("li").length === 0) {
          $("<li>")
            .text(I18n.t("javascripts.query.nothing_found"))
            .appendTo($ul);
        }
      },
      error: function(xhr, status, error) {
        $section.find(".loader").stopTime("loading").hide();

        $("<li>")
          .text(I18n.t("javascripts.query." + status, { server: url, error: error }))
          .appendTo($ul);
      }
    }));
  }

  function compareSize(feature1, feature2) {
    var width1 = feature1.bounds.maxlon - feature1.bounds.minlon,
      height1 = feature1.bounds.maxlat - feature1.bounds.minlat,
      area1 = width1 * height1,
      width2 = feature2.bounds.maxlat - feature2.bounds.minlat,
      height2 = feature2.bounds.maxlat - feature2.bounds.minlat,
      area2 = width2 * height2;

    return area1 - area2;
  }

  /*
   * To find nearby objects we ask overpass for the union of the
   * following sets:
   *
   *   node(around:<radius>,<lat>,lng>)
   *   way(around:<radius>,<lat>,lng>)
   *   relation(around:<radius>,<lat>,lng>)
   *
   * to find enclosing objects we first find all the enclosing areas:
   *
   *   is_in(<lat>,<lng>)->.a
   *
   * and then return the union of the following sets:
   *
   *   relation(pivot.a)
   *   way(pivot.a)
   *
   * In both cases we then ask to retrieve tags and the geometry
   * for each object.
   */
  function queryOverpass(lat, lng) {
    var latlng = L.latLng(lat, lng).wrap(),
      bounds = map.getBounds().wrap(),
      bbox = bounds.getSouth() + "," + bounds.getWest() + "," + bounds.getNorth() + "," + bounds.getEast(),
      radius = 10 * Math.pow(1.5, 19 - map.getZoom()),
      around = "around:" + radius + "," + lat + "," + lng,
      nodes = "node(" + around + ")",
      ways = "way(" + around + ")",
      relations = "relation(" + around + ")",
      nearby = "(" + nodes + ";" + ways + ");out tags geom(" + bbox + ");" + relations + ";out geom(" + bbox + ");",
      isin = "is_in(" + lat + "," + lng + ")->.a;way(pivot.a);out tags geom(" + bbox + ");relation(pivot.a);out tags bb;";

    $("#sidebar_content .query-intro")
      .hide();

    if (marker) map.removeLayer(marker);
    marker = L.circle(latlng, radius, featureStyle).addTo(map);

    $(document).everyTime(75, "fadeQueryMarker", function (i) {
      if (i === 10) {
        map.removeLayer(marker);
      } else {
        marker.setStyle({
          opacity: 1 - i * 0.1,
          fillOpacity: 0.5 - i * 0.05
        });
      }
    }, 10);

    runQuery(latlng, radius, nearby, $("#query-nearby"));
    runQuery(latlng, radius, isin, $("#query-isin"), compareSize);
  }

  function clickHandler(e) {
    var precision = OSM.zoomPrecision(map.getZoom()),
      latlng = e.latlng.wrap(),
      lat = latlng.lat.toFixed(precision),
      lng = latlng.lng.toFixed(precision);

    OSM.router.route("/query?lat=" + lat + "&lon=" + lng);
  }

  function enableQueryMode() {
    queryButton.addClass("active");
    map.on("click", clickHandler);
    $(map.getContainer()).addClass("query-active");
  }

  function disableQueryMode() {
    if (marker) map.removeLayer(marker);
    $(map.getContainer()).removeClass("query-active").removeClass("query-disabled");
    map.off("click", clickHandler);
    queryButton.removeClass("active");
  }

  var page = {};

  page.pushstate = page.popstate = function(path) {
    OSM.loadSidebarContent(path, function () {
      page.load(path, true);
    });
  };

  page.load = function(path, noCentre) {
    var params = querystring.parse(path.substring(path.indexOf('?') + 1)),
      latlng = L.latLng(params.lat, params.lon);

    if (!window.location.hash && !noCentre && !map.getBounds().contains(latlng)) {
      OSM.router.withoutMoveListener(function () {
        map.setView(latlng, 15);
      });
    }

    queryOverpass(params.lat, params.lon);
  };

  page.unload = function(sameController) {
    if (!sameController) {
      disableQueryMode();
    }
  };

  return page;
};
/*
  OSM.Router implements pushState-based navigation for the main page and
  other pages that use a sidebar+map based layout (export, search results,
  history, and browse pages).

  For browsers without pushState, it falls back to full page loads, which all
  of the above pages support.

  The router is initialized with a set of routes: a mapping of URL path templates
  to route controller objects. Path templates can contain placeholders
  (`/note/:id`) and optional segments (`/:type/:id(/history)`).

  Route controller objects can define four methods that are called at defined
  times during routing:

     * The `load` method is called by the router when a path which matches the
       route's path template is loaded via a normal full page load. It is passed
       as arguments the URL path plus any matching arguments for placeholders
       in the path template.

     * The `pushstate` method is called when a page which matches the route's path
       template is loaded via pushState. It is passed the same arguments as `load`.

     * The `popstate` method is called when returning to a previously
       pushState-loaded page via popstate (i.e. browser back/forward buttons).

     * The `unload` method is called on the exiting route controller when navigating
       via pushState or popstate to another route.

   Note that while `load` is not called by the router for pushState-based loads,
   it's frequently useful for route controllers to call it manually inside their
   definition of the `pushstate` and `popstate` methods.

   An instance of OSM.Router is assigned to `OSM.router`. To navigate to a new page
   via pushState (with automatic full-page load fallback), call `OSM.router.route`:

       OSM.router.route('/way/1234');

   If `route` is passed a path that matches one of the path templates, it performs
   the appropriate actions and returns true. Otherwise it returns false.

   OSM.Router also handles updating the hash portion of the URL containing transient
   map state such as the position and zoom level. Some route controllers may wish to
   temporarily suppress updating the hash (for example, to omit the hash on pages
   such as `/way/1234` unless the map is moved). This can be done by using
   `OSM.router.withoutMoveListener` to run a block of code that may update
   move the map without the hash changing.
 */

OSM.Router = function(map, rts) {
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;

  function Route(path, controller) {
    var regexp = new RegExp('^' +
      path.replace(escapeRegExp, '\\$&')
        .replace(optionalParam, '(?:$1)?')
        .replace(namedParam, function(match, optional){
          return optional ? match : '([^\/]+)';
        })
        .replace(splatParam, '(.*?)') + '(?:\\?.*)?$');

    var route = {};

    route.match = function(path) {
      return regexp.test(path);
    };

    route.run = function(action, path) {
      var params = [];

      if (path) {
        params = regexp.exec(path).map(function(param, i) {
          return (i > 0 && param) ? decodeURIComponent(param) : param;
        });
      }

      params = params.concat(Array.prototype.slice.call(arguments, 2));

      return (controller[action] || $.noop).apply(controller, params);
    };

    return route;
  }

  var routes = [];
  for (var r in rts)
    routes.push(new Route(r, rts[r]));

  routes.recognize = function(path) {
    for (var i = 0; i < this.length; i++) {
      if (this[i].match(path)) return this[i];
    }
  };

  var currentPath = window.location.pathname.replace(/(.)\/$/, '$1') + window.location.search,
    currentRoute = routes.recognize(currentPath),
    currentHash = location.hash || OSM.formatHash(map);

  var router = {};

  if (window.history && window.history.pushState) {
    $(window).on('popstate', function(e) {
      if (!e.originalEvent.state) return; // Is it a real popstate event or just a hash change?
      var path = window.location.pathname + window.location.search,
        route = routes.recognize(path);
      if (path === currentPath) return;
      currentRoute.run('unload', null, route === currentRoute);
      currentPath = path;
      currentRoute = route;
      currentRoute.run('popstate', currentPath);
      map.setState(e.originalEvent.state, {animate: false});
    });

    router.route = function (url) {
      var path = url.replace(/#.*/, ''),
        route = routes.recognize(path);
      if (!route) return false;
      currentRoute.run('unload', null, route === currentRoute);
      var state = OSM.parseHash(url);
      map.setState(state);
      window.history.pushState(state, document.title, url);
      currentPath = path;
      currentRoute = route;
      currentRoute.run('pushstate', currentPath);
      return true;
    };

    router.replace = function (url) {
      window.history.replaceState(OSM.parseHash(url), document.title, url);
    };

    router.stateChange = function(state) {
      if (state.center) {
        window.history.replaceState(state, document.title, OSM.formatHash(state));
      } else {
        window.history.replaceState(state, document.title, window.location);
      }
    };
  } else {
    router.route = router.replace = function (url) {
      window.location.assign(url);
    };

    router.stateChange = function(state) {
      if (state.center) window.location.replace(OSM.formatHash(state));
    };
  }

  router.updateHash = function() {
    var hash = OSM.formatHash(map);
    if (hash === currentHash) return;
    currentHash = hash;
    router.stateChange(OSM.parseHash(hash));
  };

  router.hashUpdated = function() {
    var hash = location.hash;
    if (hash === currentHash) return;
    currentHash = hash;
    var state = OSM.parseHash(hash);
    map.setState(state);
    router.stateChange(state, hash);
  };

  router.withoutMoveListener = function (callback) {
    function disableMoveListener() {
      map.off('moveend', router.updateHash);
      map.once('moveend', function () {
        map.on('moveend', router.updateHash);
      });
    }

    map.once('movestart', disableMoveListener);
    callback();
    map.off('movestart', disableMoveListener);
  };

  router.load = function() {
    var loadState = currentRoute.run('load', currentPath);
    router.stateChange(loadState || {});
  };

  router.setCurrentPath = function (path) {
    currentPath = path;
    currentRoute = routes.recognize(currentPath);
  };

  map.on('moveend baselayerchange overlaylayerchange', router.updateHash);
  $(window).on('hashchange', router.hashUpdated);

  return router;
};
