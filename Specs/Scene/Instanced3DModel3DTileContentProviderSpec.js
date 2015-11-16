/*global defineSuite*/
defineSuite([
        'Scene/Instanced3DModel3DTileContentProvider',
        'Core/Cartesian3',
        'Scene/Cesium3DTileset',
        'Specs/createScene',
        'Specs/pollToPromise',
        'ThirdParty/when'
    ], function(
        Instanced3DModel3DTileContentProvider,
        Cartesian3,
        Cesium3DTileset,
        createScene,
        pollToPromise,
        when) {
    "use strict";

    var scene;

    beforeAll(function() {
        scene = createScene();
    });

    afterAll(function() {
        scene.destroyForSpecs();
    });

    beforeEach(function() {
        // TODO : Nothing here yet
    });

    afterEach(function() {
        scene.primitives.removeAll();
    });

    function setView(destination) {
        scene.camera.setView({
           destination : destination
        });
    }

    function loadTileset(url) {
        // Load a tileset than contains a single tile
        var tileset = scene.primitives.add(new Cesium3DTileset({
            url : url
        }));

        return pollToPromise(function() {
            // Render scene to progressively load the tileset
            var tilesetReady = tileset.ready;
            scene.renderForSpecs();

            // TODO : can I just set the view from known coordinates? All these tests are the same
            // Set the camera
            if (!tilesetReady && tileset.ready) {
                // tiles.json is loaded
                var box = tileset._root._tileBoundingBox;
                var rectangle = box.rectangle;
                var west = rectangle.west;
                var south = rectangle.south;
                var east = rectangle.east;
                var north = rectangle.north;
                var height = box.maximumHeight;

                var longitude = west + (west - east) / 2.0;
                var latitude = south + (north - south) / 2.0;

                // Set view so content begins to load
                setView(Cartesian3.fromRadians(longitude, latitude, height));
            }

            // Check if content is loaded
            if (tilesetReady) {
                var root = tileset._root;
                return root.isReady();
            }
            return false;
        }, { timeout: 10000 }).then(function() {
            return tileset;
        });
    }

    it('Instanced 3D Model tile renders', function() {
        var url = '../../SampleData/tiles3d/instancedWithBatchTable.json';
        return loadTileset(url).then(function(tileset) {
            tileset.show = false;
            expect(scene.renderForSpecs()).toEqual([0, 0, 0, 255]);
            tileset.show = true;
            expect(scene.renderForSpecs()).not.toEqual([0, 0, 0, 255]);
        });
    });

});
