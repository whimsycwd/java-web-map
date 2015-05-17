package com.whimsy.entity;

/**
 * Created by whimsy on 5/13/15.
 */
public class Node {

    public int id;
    public double lon;
    public double lat;

    public Node(int id, double lat, double lon) {
        this.id = id;
        this.lon = lon;
        this.lat = lat;
    }
    public Node(double lat, double lon) {
        this.lat = lat;
        this.lon = lon;
    }
}
