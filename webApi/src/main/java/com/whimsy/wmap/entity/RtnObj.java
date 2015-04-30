package com.whimsy.wmap.entity;

import java.util.HashMap;
import java.util.Map;

import com.whimsy.wmap.primitive.Bound;
import com.whimsy.wmap.primitive.RNode;
import com.whimsy.wmap.primitive.Way;

/**
 * Created by whimsy on 4/29/15.
 */
public class RtnObj {
    private Bound bound = new Bound();
    private Map<Long, RNode> nodeMap = new HashMap<Long, RNode>();
    private Map<Long, Way> wayMap = new HashMap<Long, Way>();

    public Bound getBound() {
        return bound;
    }

    public void setBound(Bound bound) {
        this.bound = bound;
    }

    public Map<Long, RNode> getNodeMap() {
        return nodeMap;
    }

    public void setNodeMap(Map<Long, RNode> nodeMap) {
        this.nodeMap = nodeMap;
    }

    public Map<Long, Way> getWayMap() {
        return wayMap;
    }

    public void setWayMap(Map<Long, Way> wayMap) {
        this.wayMap = wayMap;
    }
}
