package com.whimsy.process.primitivie;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by whimsy on 4/29/15.
 */
public class Way {

    private String name = "none";

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

    public void tagClassify() {
        if (pathNodes.get(0) == pathNodes.get(pathNodes.size() - 1)) {
            is_area = true;
        }

        for (Map.Entry<String, String> entry : tags.entrySet()) {
            if (entry.getKey().equals("name")) {
                name = entry.getValue();
            }
        }

    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
