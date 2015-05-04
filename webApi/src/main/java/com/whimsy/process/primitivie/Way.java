package com.whimsy.process.primitivie;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by whimsy on 4/29/15.
 */
public class Way {

    public final static double ROAD_WIDTH = 3;
    public final static double MID = ROAD_WIDTH / 2;
    public final static double SMALL = ROAD_WIDTH / 3;

    public boolean is_area = false;

    private List<Long> pathNodes = new ArrayList<Long>();

    private Map<String, String> tags = new HashMap<String, String>();

    public List<Long> getPathNodes() {
        return pathNodes;
    }

    public void setPathNodes(List<Long> pathNodes) {
        this.pathNodes = pathNodes;
    }

    public Map<String, String> getTags() {
        return tags;
    }

    public void setTags(Map<String, String> tags) {
        this.tags = tags;
    }

    public void tag_classify() {
        if (pathNodes.get(0) == pathNodes.get(pathNodes.size() - 1)) {
            is_area = true;
        }

        for (String key : tags.keySet()) {
            if (key.equals("aeroway")) {
                String tag = tags.get(key);

                if (tag.equals("runway")) {
                    is_area = false;
                }
            }
        }

    }
}
