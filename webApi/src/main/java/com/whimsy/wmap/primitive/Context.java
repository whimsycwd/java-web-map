package com.whimsy.wmap.primitive;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by whimsy on 4/29/15.
 */
public class Context {

    public static Map<Long, RNode> nodeMap = new HashMap<Long, RNode>();

    public static Map<Long, Way> wayMap = new HashMap<Long, Way>();

    public static Bound bound = new Bound();

}
