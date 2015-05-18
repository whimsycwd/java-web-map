all : compile run

compile : 
	g++ -std=c++11 EntryMain.cpp Map.cpp GeoPoint.cpp PointGridIndex.cpp MapMatching.cpp -w -o Main

run :
	./Main

clean :
	rm -rf Main
