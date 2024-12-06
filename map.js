const arcgis = {
  import: (modules) => {
    return new Promise((resolve, reject) => {
      require(modules, (...loadedModules) => {
        resolve(loadedModules);
      }, (err) => {
        reject(err);
      });
    });
  },
};

async function createMap() {
  const [Map, MapView, GraphicsLayer] = await arcgis.import([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GraphicsLayer",
  ]);

  const map = new Map({
    basemap: "streets-vector",
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
  });

  await view.when();

  // Create a graphics layer
  const graphicsLayer = new GraphicsLayer();
  view.map.add(graphicsLayer);

  return [map, view, graphicsLayer];
}

export class Map {
  constructor() {}

  async initialize() {
    [this.map, this.view, this.graphicsLayer] = await createMap();
  }

  /**
   * Removes a GeoJSON feature from the map's graphics layer by its ID.
   *
   * This function finds a graphic on the graphics layer that matches the given ID
   * and removes it. If no graphic is found with the given ID, this function does
   * nothing.
   *
   * @param {string} id ID of the GeoJSON feature to remove
   * @returns {Promise<void>} Promise that resolves when the graphic has been removed
   */
  async removeGeoJson(id) {
    const graphicToDelete = this.graphicsLayer.graphics.find((graphic) => {
      return graphic.attributes.id === id;
    });
    if (graphicToDelete) {
      this.graphicsLayer.remove(graphicToDelete);
    }
  }

  /**
   * Adds a GeoJSON feature to the map's graphics layer.
   *
   * This function supports adding Point, Polygon, and LineString geometries.
   * It creates a graphic with appropriate symbols and attributes derived from
   * the GeoJSON feature and adds it to the graphics layer for rendering on the map.
   *
   * @param {string} id - A unique identifier for the GeoJSON feature.
   * @param {Object} geojson - The GeoJSON object containing the geometry and properties.
  
   * 
   * Supported geometry types:
   * - "Point": Creates a red point with a white outline.
   * - "Polygon": Creates a semi-transparent blue polygon with a black outline.
   * - "LineString": Creates an orange solid line.
   */
  async addGeoJson(id, geojson) {
    const [
      Point,
      SimpleMarkerSymbol,
      Graphic,
      Polygon,
      SimpleFillSymbol,
      Polyline,
      SimpleLineSymbol,
    ] = await arcgis.import([
      "esri/geometry/Point",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/Graphic",
      "esri/geometry/Polygon",
      "esri/symbols/SimpleFillSymbol",
      "esri/geometry/Polyline",
      "esri/symbols/SimpleLineSymbol",
    ]);

    const geometry = geojson.geometry;
    const attributes = geojson.properties;

    let graphic;

    if (geometry.type === "Point") {
      const point = new Point({
        longitude: geometry.coordinates[0],
        latitude: geometry.coordinates[1],
      });

      const symbol = new SimpleMarkerSymbol({
        color: [255, 0, 0], // Red color
        size: 10, // Point size
        outline: { color: [255, 255, 255], width: 2 }, // White outline
      });

      graphic = new Graphic({
        geometry: point,
        symbol: symbol,
        attributes: { id, ...attributes },
      });
    }

    if (geometry.type === "Polygon") {
      const polygon = new Polygon({
        rings: geometry.coordinates,
      });

      const symbol = new SimpleFillSymbol({
        color: [51, 51, 204, 0.3], // Semi-transparent blue
        outline: { color: [0, 0, 0], width: 2 }, // Black outline
      });

      graphic = new Graphic({
        geometry: polygon,
        symbol: symbol,
        attributes: { id, ...attributes },
      });
    }

    if (geometry.type === "LineString") {
      const polyline = new Polyline({
        paths: geometry.coordinates,
      });

      const lineSymbol = new SimpleLineSymbol({
        color: [226, 119, 40], // Orange color
        width: 4,
        style: "solid", // Line style
      });

      graphic = new Graphic({
        geometry: polyline,
        symbol: lineSymbol,
        attributes: { id, ...attributes },
      });
    }

    // Add the graphic to the GraphicsLayer
    this.graphicsLayer.add(graphic);
  }
}
