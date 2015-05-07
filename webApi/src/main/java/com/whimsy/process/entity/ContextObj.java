package com.whimsy.process.entity;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.whimsy.process.LoadOSM;
import com.whimsy.process.primitivie.Bound;
import com.whimsy.process.primitivie.Node;
import com.whimsy.process.primitivie.Way;

/**
 * Created by whimsy on 4/29/15.
 */
public class ContextObj {

    static Logger logger = LoggerFactory.getLogger(ContextObj.class);


    private Bound bound = new Bound();
    private Map<Long, Node> nodeMap = new HashMap<Long, Node>();
    private Map<Long, Way> wayMap = new HashMap<Long, Way>();

    private ContextObj() {

    }

    private static ContextObj instance = new ContextObj();


    private static boolean isLoaded = false;
    public static ContextObj getInstance() {

        logger.info("ContextObj Building Start!");
        if (!isLoaded) {
           instance = new LoadOSM(instance).work();
        }

        logger.info("ContextObj Building End.");
        return instance;
    }

    public Bound getBound() {
        return bound;
    }

    public void setBound(Bound bound) {
        this.bound = bound;
    }

    public Map<Long, Node> getNodeMap() {
        return nodeMap;
    }

    public void setNodeMap(Map<Long, Node> nodeMap) {
        this.nodeMap = nodeMap;
    }

    public Map<Long, Way> getWayMap() {
        return wayMap;
    }

    public void setWayMap(Map<Long, Way> wayMap) {
        this.wayMap = wayMap;
    }

    public static void main(String[] args) {
        ContextObj obj = ContextObj.getInstance();
    }
}
