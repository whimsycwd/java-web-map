package com.whimsy.wmap.primitive;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by whimsy on 4/29/15.
 */
public class RNode {

    private double longtitude;
    private double latitude;

    private Map<String, String> tags = new HashMap<String, String>();

    public double getLongtitude() {
        return longtitude;
    }

    public void setLongtitude(double longtitude) {
        this.longtitude = longtitude;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }
}
