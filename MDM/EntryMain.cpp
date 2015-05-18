#include "Map.h"
#include<iostream>
#include "MapMatching.h"
#include "GeoPoint.h"
#include<set>

using namespace std;

void test1() {
	Area area(0, 5, 0, 5);
	Map roadNetwrok("./testData/", &area, 1);;



	// vector<Edge *> edges;

	// roadNetwrok.getNearEdges(2, 1, 4, edges);

	// for (auto edge : edges) {
	// 	printf("%d %d\n", edge->startNodeId, edge->endNodeId);
	// }

	list<GeoPoint*> traj;

	traj.push_back(new GeoPoint(2, 1, 0));
	traj.push_back(new GeoPoint(3.5, 2, 1));
	traj.push_back(new GeoPoint(3, 3, 2));



	MapMatcher matcher(&roadNetwrok);
    

	list<Edge*> resEdges;

	matcher.MapMatching(traj, resEdges, 4);

	for (auto edge : resEdges) {
		printf("%d %d\n", edge->startNodeId, edge->endNodeId);
	}

    cout << "Ooops..." << endl;
}


double projectPointFromTransplantFromSRC(double lat, double lon, Edge* edge, double& prjDist, GeoPoint * pjPoint)
{
	//////////////////////////////////////////////////////////////////////////
	///移植SRC版本：返回(lat,lon)点到edge的距离，单位为米；同时记录投影点到edge起点的距离存入prjDist
	//////////////////////////////////////////////////////////////////////////
	double tmpSideLen = 0;
	double result = 1e80, tmp = 0;
	double x = -1, y = -1;
	for (Figure::iterator figIter = edge->figure->begin(); figIter != edge->figure->end(); figIter++){
		if (x != -1 && y != -1){
			double x2 = (*figIter)->lat;
			double y2 = (*figIter)->lon;
			double dist = GeoPoint::distM(x, y, lat, lon); //circle Distance(x, y, nodeX, nodeY);
			if (dist<result){
				result = dist;
				tmpSideLen = tmp;
			}
			double vecX1 = x2 - x;
			double vecY1 = y2 - y;
			double vecX2 = lat - x;
			double vecY2 = lon - y;
			double vecX3 = lat - x2;
			double vecY3 = lon - y2;
			if (vecX1*vecX2 + vecY1*vecY2>0 && -vecX1*vecX3 - vecY1*vecY3 > 0 && (vecX1 != 0 || vecY1 != 0)){
				double rate = ((lat - x2)*vecX1 + (lon - y2)*vecY1) / (-vecX1*vecX1 - vecY1*vecY1);
				double nearX = rate*x + (1 - rate)*x2, nearY = rate*y + (1 - rate)*y2;
				double dist = GeoPoint::distM(nearX, nearY, lat, lon);
				if (dist < result){
					result = dist;

					pjPoint->lat = nearX;
					pjPoint->lon = nearY;

					tmpSideLen = tmp + GeoPoint::distM(x, y, nearX, nearY);
				}
			}
			tmp += GeoPoint::distM(x, y, x2, y2);
		}
		x = (*figIter)->lat;
		y = (*figIter)->lon;
	}
	prjDist = tmpSideLen;
	return result;
}

void work() {
	Area area(39.309978, 40.380323, 115.743800, 117.076883);
	Map roadNetwrok("./BeijingMap/", &area, 1);;

	list<GeoPoint*> traj;

	ifstream ifs("./BeijingMap/20081023025304.path");


	double lat;
	double lon;
	long time;
	while (ifs >> lat >> lon >> time) {
		// printf("%.6lf %.6lf %d\n", lat, lon, time);
		traj.push_back(new GeoPoint(lat, lon, time));
	}
	MapMatcher matcher(&roadNetwrok);
	list<Edge*> resEdges;

	matcher.MapMatching(traj, resEdges, 10);



	printf("%d %d\n", traj.size(), resEdges.size());


	ofstream ofs("pjNode.txt");


	int idx = 0;
	double pjDist;

	list<GeoPoint*> ::iterator iter = traj.begin();

	for (auto edge : resEdges) {

		cout << projectPointFromTransplantFromSRC((*iter)->lat, (*iter)->lon, edge, pjDist, *iter) << endl;
		++idx;
		// ++iter;
	}


	for (auto point : traj) {
		ofs << point->lat << " " << point->lon << endl;
	}

	ofs.close();

	cout << "Oooooooooooops" << endl;
}

int main() {

	work();

    return 0;
}
