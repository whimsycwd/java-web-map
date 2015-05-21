package com.whimsy.algo;

/**
 * Created by whimsy on 5/14/15.
 */


import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.whimsy.Config;
import com.whimsy.entity.Edge;
import com.whimsy.entity.Graph;

import edu.princeton.cs.algs4.Stack;

public class SCCKosarajuNotRecursive {

    public static List<List<Integer>> scc(List<Integer>[] graph) {
        int n = graph.length;
        boolean[] used = new boolean[n];
        int [] memo_bag = new int[n];
        List<Integer> order = new ArrayList<Integer>();
        for (int i = 0; i < n; i++)
            if (!used[i])
                dfs(graph, used, order, i, memo_bag);

        List<Integer>[] reverseGraph = new List[n];
        for (int i = 0; i < n; i++)
            reverseGraph[i] = new ArrayList<Integer>();
        for (int i = 0; i < n; i++)
            for (int j : graph[i])
                reverseGraph[j].add(i);

        List<List<Integer>> components = new ArrayList<List<Integer>>();
        Arrays.fill(used, false);
        Arrays.fill(memo_bag, 0);
        Collections.reverse(order);

        for (int u : order)
            if (!used[u]) {
                List<Integer> component = new ArrayList<Integer>();

                dfs(reverseGraph, used, component, u, memo_bag);
                
                components.add(component);
            }

        return components;
    }


    static int depth = 0;

    static void dfs(List<Integer>[] graph, boolean[] used, List<Integer> res, int u, int [] memo_bag) {

        Stack<Integer> stack = new Stack<Integer>();
        stack.push(u);

        used[u] = true;

        while (!stack.isEmpty()) {
            u = stack.peek();


            if (memo_bag[u] == graph[u].size()) {
                res.add(u);
                stack.pop();
            } else {
                int v = graph[u].get(memo_bag[u]++);
                if (used[v]) {
                    continue;
                } else {
                    used[v] = true;
                    stack.push(v);
                }
            }

        }

    }


    // Usage example
    public static void main(String[] args) {

        Graph graph = new Graph(Config.AUG_NODE_FILE, Config.AUG_EDGE_FILE, false);
//        Graph graph = new Graph(Config.NODE_FILE, Config.EDGE_FILE);
        List<Integer>[] g = new List[graph.bags.length];
        for (int i = 0; i < g.length; i++) {
            g[i] = new ArrayList<Integer>();
            for (Edge edge : graph.bags[i]) {
                g[i].add(edge.tar);
            }
        }

        List<List<Integer>> components = scc(g);
        System.out.println(components.size());
    }
}