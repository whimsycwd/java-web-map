package com.whimsy.process;

import java.util.Map;

import com.whimsy.Config;
import com.whimsy.process.entity.ContextObj;
import com.whimsy.process.primitivie.Bound;
import com.whimsy.process.primitivie.Node;
import com.whimsy.process.primitivie.Way;

import processing.core.PApplet;
import processing.data.XML;

/**
 * Created by whimsy on 5/2/15.
 */
public class LoadOSM extends PApplet {

    public LoadOSM(ContextObj ctx) {
        this.ctx = ctx;
    }

    private ContextObj ctx = null;

//    private String osmFilePath = "./osm-data/fudan.osm";
//    private String osmFilePath = "./osm-data/chengdu_china.osm";

    private String osmFilePath = Config.OSM_FILE_PATH;
    public ContextObj work() {

        Long startTime = System.currentTimeMillis();

        System.out.printf("Load OSM file from %s\n", osmFilePath);

        XML mapData = loadXML(osmFilePath);

        XML bounds = mapData.getChild("bounds");
        loadBounds(bounds);

        XML[] nodes = mapData.getChildren("node");
        loadNodes(nodes);

        XML[] ways = mapData.getChildren("way");
        loadWays(ways);

        System.out.printf("Load XML :  %.1f sec\n", (double) (System.currentTimeMillis() - startTime) / 1000);

        System.out.printf("Node Number : %d\n", ctx.getNodeMap().size());
        System.out.printf("Way Number : %d\n", ctx.getWayMap().size());
        return ctx;
    }

    private void loadWays(XML[] xmls) {
        Map<Long, Way> wayMap = ctx.getWayMap();

        for (XML xml : xmls) {
            Long id = xml.getLong("id", -1);

            Way way = new Way();

            XML[] pathNodes = xml.getChildren("nd");
            for (XML node : pathNodes) {
                way.getPathNodes().add(node.getLong("ref", -1));
            }

            XML[] tags = xml.getChildren("tag");

            for (XML tag : tags) {
                way.getTags().put(tag.getString("k"), tag.getString("v"));
            }

            way.tagClassify();
            wayMap.put(id, way);

        }
    }

    private void loadNodes(XML[] xmls) {
        Map<Long, Node> nodeMap = ctx.getNodeMap();

        for (XML xml : xmls) {
            Long id = xml.getLong("id", -1);

            Node node = new Node();

            node.setLon(xml.getDouble("lon"));
            node.setLat(xml.getDouble("lat"));


            XML[] tags = xml.getChildren("tag");
            for (XML tag : tags) {
                node.getTags().put(tag.getString("k"), tag.getString("v"));
            }

            node.tagClassify();
            nodeMap.put(id, node);
        }
    }

    private void loadBounds(XML xml) {
        Bound bound = ctx.getBound();

        bound.setMinLon(xml.getDouble("minlon"));
        bound.setMaxLon(xml.getDouble("maxlon"));
        bound.setMinLat(xml.getDouble("minlat"));
        bound.setMaxLat(xml.getDouble("maxlat"));

    }
}
