package com.whimsy.process.primitivie;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by whimsy on 4/29/15.
 */
public class Node {

    private double lon;
    private double lat;

    private String name = "none";

    public Node() {

    }

    public Node(double lon, double lat) {
        this.lon = lon;
        this.lat = lat;
    }

    private Map<String, String> tags = new HashMap<String, String>();

    public double getLon() {
        return lon;
    }

    public void setLon(double lon) {
        this.lon = lon;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public Map<String, String> getTags() {
        return tags;
    }

    public void setTags(Map<String, String> tags) {
        this.tags = tags;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void tagClassify() {
        for (Map.Entry<String, String> entry : tags.entrySet()) {
            if (entry.getKey().equals("name")) {
                name = entry.getValue();
            }
        }
    }
}
