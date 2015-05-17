package com.whimsy.algo;
/**
 * It's actually a 2 dimension tree, for now..
 * 
 * @author whimsycwd
 * @since 2014.3.12
 *
 * @date 2015.5.4
 * change to fit map app's requirement.
 *
 */

import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.whimsy.entity.Bound;
import com.whimsy.entity.Graph;

import edu.princeton.cs.algs4.Point2D;
import edu.princeton.cs.introcs.StdDraw;

public class KdTree {

	static final Logger logger = LoggerFactory.getLogger(KdTree.class);


	private static final boolean HORIZONTAL = true;

	private static final double MARGIN = 1;

	private static class Node {
		private Point point; // the point
		private RectHV rect; // the axis-aligned rectangle corresponding to this
		// node
		private Node left; // the left/bottom subtree
		private Node right; // the right/top subtree

		public Node(Point p, RectHV rect) {
			this.point = p;
			this.rect = rect;
		}
	}

	public static class Point extends Point2D {
		private Integer id;

		public Point(double x, double y) {
			super(x,y);
		}

		public Point(Integer id, double x, double y) {
			super(x, y);
			this.id = id;
		}

		public Point(double x, double y, Integer id) {
			super(x, y);
			this.id = id;
		}

		public Integer getId() {
			return id;
		}

		public void setId(Integer id) {
			this.id = id;
		}
	}

	private Bound bound;


	public KdTree(Graph graph) {
		logger.info("Building KdTree start!");

		Long statTime = System.currentTimeMillis();

		this.bound = graph.bound;


		logger.info("Bound here is minLon = {} maxLon = {} minLat = {}  maxLat {}",
					   bound.minLon, bound.maxLon, bound.minLat, bound.maxLat);

		for (com.whimsy.entity.Node node : graph.nodes) {
			this.insert(new Point(node.id, node.lon, node.lat));
		}


		logger.info("Node inserted : {} \nBuilding KdTree end. used Time {}",
							 this.size(), (double) (System.currentTimeMillis() - statTime) / 1000);

	}


	public KdTree() {
		bound.minLat = 0;
		bound.maxLat = 1;
		bound.minLon = 0;
		bound.maxLon = 1;
	}



	private Node root;

	private int size = 0;

	public boolean isEmpty() {
		// is the set empty?
		return root == null;
	}

	public int size() {
		// number of points in the set
		return size;
	}

	public void insert(Point p) {
		// add the point p to the set (if it is not already in the set)
		root = insert(root, null, p, HORIZONTAL);
	}

	private Node insert(Node node, Node parentNode, Point p, boolean orient) {
		if (node == null) {

			double rectXmin = bound.minLon - MARGIN;
			double rectXmax = bound.maxLon + MARGIN;
			double rectYmin = bound.minLat - MARGIN;
			double rectYmax = bound.maxLat + MARGIN;

			if (parentNode != null) {
				if (HORIZONTAL == orient) {
					rectXmin = parentNode.rect.xmin();
					rectXmax = parentNode.rect.xmax();
					if (p.y() < parentNode.point.y()) {
						rectYmin = parentNode.rect.ymin();
						rectYmax = parentNode.point.y();
					} else if (p.y() > parentNode.point.y()) {
						rectYmin = parentNode.point.y();
						rectYmax = parentNode.rect.ymax();
					}
				} else {
					rectYmax = parentNode.rect.ymax();
					rectYmin = parentNode.rect.ymin();
					if (p.x() < parentNode.point.x()) {
						rectXmin = parentNode.rect.xmin();
						rectXmax = parentNode.point.x();
					} else if (p.x() > parentNode.point.x()) {
						rectXmin = parentNode.point.x();
						rectXmax = parentNode.rect.xmax();
					}
				}
			}
			return new Node(p, new RectHV(rectXmin, rectYmin, rectXmax,
					rectYmax));
		}
		double newKey = HORIZONTAL == orient ? p.x() : p.y();
		double nodeKey = HORIZONTAL == orient ? node.point.x() : node.point.y();
		if (newKey < nodeKey) {
			node.left = insert(node.left, node, p, !orient);
		} else if (newKey > nodeKey) {
			node.right = insert(node.right, node, p, !orient);
		} else {
			double newValue = HORIZONTAL == orient ? p.y() : p.x();
			double nodeValue = HORIZONTAL == orient ? node.point.y()
					: node.point.x();
			if (newValue == nodeValue) {
				node.point = p;
			} else {
				node.right = insert(node.right, node, p, !orient);
			}
		}
		return node;
	}

	public boolean contains(Point p) {
		// does the set contain the point p?
		return get(root, p, HORIZONTAL) != null;
	}

	private Point get(Node node, Point p, boolean orient) {
		if (node == null) {
			return null;
		}

		double newKey;
		double nodeKey;
		if (HORIZONTAL == orient) {
			newKey = p.x();
			nodeKey = node.point.x();
		} else {
			newKey = p.y();
			nodeKey = node.point.y();
		}

		if (newKey < nodeKey) {
			return get(node.left, p, !orient);
		} else if (newKey > nodeKey) {
			return get(node.right, p, !orient);
		} else {
			if (HORIZONTAL == orient) {
				newKey = p.y();
				nodeKey = node.point.y();
			} else {
				newKey = p.x();
				nodeKey = node.point.x();
			}

			if (newKey == nodeKey) {
				return node.point;
			} else {
				return get(node.right, p, !orient);
			}
		}
	}

	public void draw() {
		// draw all of the points to standard draw
		drawPoint(root, null, HORIZONTAL);
	}

	private void drawPoint(Node node, Node parentNode, boolean orient) {
		if (node == null) {
			return;
		}
		StdDraw.setPenColor(StdDraw.BLACK);
		StdDraw.setPenRadius(.01);
		node.point.draw();

		StdDraw.setPenRadius();
		StdDraw.setPenColor(HORIZONTAL == orient ? StdDraw.RED : StdDraw.BLUE);
		if (HORIZONTAL == orient) {
			if (parentNode != null) {
				if (node.point.y() < parentNode.point.y()) {
					new Point(node.point.x(), parentNode.rect.ymin())
							.drawTo(new Point(node.point.x(),
									parentNode.point.y()));
				} else if (node.point.y() > parentNode.point.y()) {
					new Point(node.point.x(), parentNode.point.y())
							.drawTo(new Point(node.point.x(), parentNode.rect
									.ymax()));
				}
			} else {
				new Point(node.point.x(), 0.0).drawTo(new Point(node.point
						.x(), 1.0));
			}
		} else {
			if (parentNode != null) {
				if (node.point.x() < parentNode.point.x()) {
					new Point(parentNode.rect.xmin(), node.point.y())
							.drawTo(new Point(parentNode.point.x(),
									node.point.y()));
				} else if (node.point.x() > parentNode.point.x()) {
					new Point(parentNode.point.x(), node.point.y())
							.drawTo(new Point(parentNode.rect.xmax(),
									node.point.y()));
				}
			} else {
				new Point(0.0, node.point.y()).drawTo(new Point(1.0,
						node.point.y()));
			}
		}
		drawPoint(node.left, node, !orient);
		drawPoint(node.right, node, !orient);
	}

	public Iterable<Point> range(RectHV rect) {
		// all points in the set that are inside the rectangle
		Set<Point> result = new HashSet<Point>();
		rangeSearch(root, rect, result);
		return result;
	}

	private void rangeSearch(Node node, RectHV rect, Set<Point> result) {
		if (node == null || !rect.intersects(node.rect)) {
			return;
		}
		if (rectContainsPoint(rect, node.point)) {
			result.add(node.point);
		}
		rangeSearch(node.left, rect, result);
		rangeSearch(node.right, rect, result);
	}

	private static boolean rectContainsPoint(RectHV rect, Point point) {
		double pX = point.x();
		double pY = point.y();
		if (pX >= rect.xmin() && pX <= rect.xmax() && pY >= rect.ymin()
				&& pY <= rect.ymax()) {
			return true;
		}
		return false;
	}

	private Point nearest;

	/**
	 * Point (x = lon, y = lat)
	 *
	 * @param p
	 * @return
	 */
	public Point nearest(Point p) {
		// a nearest neighbor in the set to p; null if set is empty
		if (root == null)
			return null;
		nearest = root.point;
		nearestSearch(root, p, HORIZONTAL);
		return nearest;
	}

	public Point nearest(double lat, double lon) {
		return nearest(new Point(lon, lat));
	}


	private void nearestSearch(Node node, Point queryPoint, boolean orient) {
		if (node == null) {
			return;
		}
		double distanceToFoundSoFar = nearest.distanceSquaredTo(queryPoint);
		double distanceToCurNodeRect = node.rect.distanceSquaredTo(queryPoint);
		if (distanceToFoundSoFar < distanceToCurNodeRect) {
			return;
		} else {
			if (nearest.distanceSquaredTo(queryPoint) > node.point
					.distanceSquaredTo(queryPoint)) {
				nearest = node.point;
			}
			Node firstNode = null;
			Node secondNode = null;
			if (HORIZONTAL == orient) {
				if (queryPoint.x() < node.point.x()) {
					firstNode = node.left;
					secondNode = node.right;
				} else {
					firstNode = node.right;
					secondNode = node.left;
				}
			} else {
				if (queryPoint.y() < node.point.y()) {
					firstNode = node.left;
					secondNode = node.right;
				} else {
					firstNode = node.right;
					secondNode = node.left;
				}
			}
			nearestSearch(firstNode, queryPoint, !orient);
			nearestSearch(secondNode, queryPoint, !orient);
		}
	}


	public static void main(String [] args) {
		KdTree kdTree = new KdTree(new Graph("./BeijingMap/nodeOSM.txt", "./BeijingMap/edgeOSM.txt"));

		Point res = kdTree.nearest(39.9061898, 116.3894982);
		System.out.println(res);
	}

}
