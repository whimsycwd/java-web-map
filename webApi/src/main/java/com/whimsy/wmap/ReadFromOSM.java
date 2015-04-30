package com.whimsy.wmap;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import com.whimsy.wmap.entity.RtnObj;
import com.whimsy.wmap.primitive.Bound;
import com.whimsy.wmap.primitive.Context;
import com.whimsy.wmap.primitive.RNode;
import com.whimsy.wmap.primitive.Way;

/**
 * Created by whimsy on 4/29/15.
 */
public class ReadFromOSM {

    private RtnObj rtnObj = new RtnObj();

    RtnObj work() {

        try {

            File file = new File(getClass().getResource("/map.osm").toString().substring("file:".length()));

            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dBuilder = dbFactory.newDocumentBuilder();


            Document doc = dBuilder.parse(file);

            extractBound(doc);

            extractNode(doc);

            extractWay(doc, Context.nodeMap);

        }
        catch (Exception e) {
            e.printStackTrace();
        }

        return rtnObj;
    }

    private void extractNode(Document doc) {


        NodeList nodeList = doc.getElementsByTagName("node");


        Map<Long, RNode> nodeMap = rtnObj.getNodeMap();

        for (int i = 0; i < nodeList.getLength(); ++i) {
            Element node = (Element) nodeList.item(i);

            Long id = Long.parseLong(node.getAttribute("id"));

            double longtitude = Double.parseDouble(node.getAttribute("lon"));
            double latitude = Double.parseDouble(node.getAttribute("lat"));


            RNode rNode = new RNode();
            rNode.setLatitude(latitude);
            rNode.setLongtitude(longtitude);

            nodeMap.put(id, rNode);
        }
    }

    private void extractWay(Document doc, Map<Long, RNode> nodeMap) {

        NodeList nodeList = doc.getElementsByTagName("way");




        for (int i = 0; i < nodeList.getLength(); ++i) {
            Element ele = (Element) nodeList.item(i);

            Long id = Long.parseLong(ele.getAttribute("id"));

            NodeList points = ele.getElementsByTagName("nd");



            Way way = new Way();

            List<RNode> list = way.getRNodes();

            for (int j = 0; j < points.getLength(); ++j) {
                Element node = (Element) points.item(j);


                Long value = Long.parseLong(node.getAttribute("ref"));

                list.add(rtnObj.getNodeMap().get(value));

            }

            rtnObj.getWayMap().put(id, way);
        }

    }

    private void extractBound(Document doc) {
        NodeList nodeList = doc.getElementsByTagName("bounds");

        assert nodeList.getLength() == 1;

        Element node = (Element) nodeList.item(0);

        Bound bound = new Bound();

        bound.setMinLat(Double.parseDouble(node.getAttribute("minlat")));
        bound.setMaxLat(Double.parseDouble(node.getAttribute("maxlat")));
        bound.setMinLon(Double.parseDouble(node.getAttribute("minlon")));
        bound.setMaxLon(Double.parseDouble(node.getAttribute("maxlon")));

        rtnObj.setBound(bound);
    }

    public static void main(String [] args)  {
        new ReadFromOSM().work();
    }
}
