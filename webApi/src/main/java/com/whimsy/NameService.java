package com.whimsy;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.whimsy.process.entity.ContextObj;
import com.whimsy.process.primitivie.Node;
import com.whimsy.process.primitivie.Way;

/**
 * Created by whimsy on 5/6/15.
 */
public class NameService {

    static final Logger logger = LoggerFactory.getLogger(NameService.class);


    private Set<String> nameDict = new TreeSet<String>();

    private Map<String, ArrayList<Node>> nameMap = new HashMap<String, ArrayList<Node>>();

    public NameService(ContextObj instance) {

        Map<Long, Node> nodeMap = instance.getNodeMap();

        for (Node node : nodeMap.values()) {

            if (!node.getName().equals("none")
                    && !nameDict.contains(node.getName())) {
                nameDict.add(node.getName());
            }

            if (!node.getName().equals("none")) {
                ArrayList<Node> nodes = nameMap.get(node.getName());

                if (nodes == null) {
                    nodes = new ArrayList<Node>();
                    nameMap.put(node.getName(), nodes);
                }

                nodes.add(node);
            }

        }

        for (Way way : instance.getWayMap().values()) {
            if (!way.getName().equals("none")
                    && !nameDict.contains(way.getName())) {
                nameDict.add(way.getName());
            }

            if (!way.getName().equals("none")) {
                ArrayList<Node> nodes = nameMap.get(way.getName());

                // use mid node of the way to stand for this way

                if (nodes == null) {
                    nodes = new ArrayList<Node>();
                    nameMap.put(way.getName(), nodes);
                }

                List<Long> path = way.getPathNodes();

                nodes.add(nodeMap.get(path.get(path.size() / 2)));
            }
        }


        logger.debug("Total Name Number : {}", nameDict.size());
    }


    public ArrayList<String> search(String queryStr) {
        ArrayList<String> res = new ArrayList<String>();

        for (String name : nameDict) {
            if (name.startsWith(queryStr)) {
                res.add(name);
                if (res.size() > Config.MAXIMUM_ENTRYS) {
                    return res;
                }
            }
        }

        for (String name : nameDict) {

            if (!name.startsWith(queryStr) && name.contains(queryStr)) {
                res.add(name);
                if (res.size() > Config.MAXIMUM_ENTRYS) {
                    return res;
                }
            }
        }
        return res;
    }

    public ArrayList<Node> findNodes(String query) {
        ArrayList<Node> res = nameMap.get(query);

        if (res == null) {
            return new ArrayList<Node>();
        } else {
            return res;
        }
    }

    public static void main(String [] args) {
        NameService service = new NameService(ContextObj.getInstance());


        System.out.println(service.search("成都"));

        System.out.println(service.findNodes("星巴克"));


    }
}
