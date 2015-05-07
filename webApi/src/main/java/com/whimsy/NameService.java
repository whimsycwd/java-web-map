package com.whimsy;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import com.whimsy.process.entity.ContextObj;
import com.whimsy.process.primitivie.Node;
import com.whimsy.process.primitivie.Way;

/**
 * Created by whimsy on 5/6/15.
 */
public class NameService {


    private Set<String> nameDict = new TreeSet<String>();

    public NameService(ContextObj instance) {
        for (Node node : instance.getNodeMap().values()) {

            if (!node.getName().equals("none")
                    && !nameDict.contains(node.getName())) {
                nameDict.add(node.getName());
            }
        }

        for (Way way : instance.getWayMap().values()) {
            if (way.getName() != null && !nameDict.contains(way.getName())) {
                nameDict.add(way.getName());
            }
        }

        System.out.printf("Total Name Number : %d\n", nameDict.size());
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

//            System.out.println(name + " " + queryStr);
            if (!name.startsWith(queryStr) && name.contains(queryStr)) {
                res.add(name);
                if (res.size() > Config.MAXIMUM_ENTRYS) {
                    return res;
                }
            }
        }
        return res;
    }

    public static void main(String [] args) {
        NameService service = new NameService(ContextObj.getInstance());


        System.out.println(service.search("成都"));


    }
}
