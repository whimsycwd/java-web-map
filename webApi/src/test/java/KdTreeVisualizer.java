

import com.whimsy.algo.KdTree;

import edu.princeton.cs.algs4.Point2D;
import edu.princeton.cs.introcs.StdDraw;

/*************************************************************************
 *  Compilation:  javac KdTreeVisualizer.java
 *  Execution:    java KdTreeVisualizer
 *  Dependencies: StdDraw.java Point2D.java com.whimsy.algo.KdTree.java
 *
 *  Add the points that the user clicks in the standard draw window
 *  to a kd-tree and draw the resulting kd-tree.
 *
 *************************************************************************/

public class KdTreeVisualizer {

    public static void main(String[] args) {
        StdDraw.show(0);
        KdTree kdtree = new KdTree();
        while (true) {
            if (StdDraw.mousePressed()) {
                double x = StdDraw.mouseX();
                double y = StdDraw.mouseY();
                System.out.printf("%8.6f %8.6f\n", x, y);
                KdTree.Point p = new KdTree.Point(x, y);
                kdtree.insert(p);
                StdDraw.clear();
                kdtree.draw();
            }
            StdDraw.show(50);
        }

    }
}