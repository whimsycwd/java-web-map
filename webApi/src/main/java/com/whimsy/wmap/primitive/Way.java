package com.whimsy.wmap.primitive;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by whimsy on 4/29/15.
 */
public class Way {

    private List<RNode> RNodes = new ArrayList<RNode>();

    private Map<String, String> tags = new HashMap<String, String>();

    public List<RNode> getRNodes() {
        return RNodes;
    }

    public void setRNodes(List<RNode> RNodes) {
        this.RNodes = RNodes;
    }

    public Map<String, String> getTags() {
        return tags;
    }

    public void setTags(Map<String, String> tags) {
        this.tags = tags;
    }
}
