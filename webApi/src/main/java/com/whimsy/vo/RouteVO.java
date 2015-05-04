package com.whimsy.vo;

import java.util.ArrayList;

/**
 * Created by whimsy on 5/4/15.
 */
public class RouteVO {
    private ArrayList<NodeVO> paths;

    public RouteVO(ArrayList<NodeVO> paths) {
        this.paths = paths;
    }

    public ArrayList<NodeVO> getPaths() {
        return paths;
    }

    public void setPaths(ArrayList<NodeVO> paths) {
        this.paths = paths;
    }
}

