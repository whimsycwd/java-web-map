package com.whimsy.entity;

import java.util.ArrayList;

/**
 * Created by whimsy on 5/13/15.
 */
public class Edge {
    public int id;
    public int sou;
    public int tar;

    public double weight;

    public ArrayList<EdgeNode> eNodes = new ArrayList<EdgeNode>();

    public static class EdgeNode {
        public double lon;
        public double lat;

    }
}
