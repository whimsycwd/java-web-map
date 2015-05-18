all : compile run

compile : 
	g++ -std=c++11 MatchMap.cpp ../Map.cpp ../GeoPoint.cpp ../PointGridIndex.cpp ../MapMatching.cpp -w -o Main

run :
	./Main ../../BeijingMap/Trajectory/000/Trajectory/20081023025304.plt.path

clean :
	rm -rf Main
