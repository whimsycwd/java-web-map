/* 
 * Last Updated at [2014/9/1 12:34] by wuhao
 */
#pragma once
#include <iostream>
#include <fstream>
#include <vector>
#include <map>
#include "GeoPoint.h"
#include "Map.h"
#include <cmath>

using namespace std;

//��ͼƥ�����ò���
#define COEFFICIENT_FOR_EMISSIONPROB 140.2384599822997282786640971977//ԭʼֵΪ0.01402384599822997282786640971977��������10000��
#define COEFFICIENT_FOR_TRANSATIONPROB 0.31273997011//ԭʼֵΪ0.00931003342301998864175922391561��������10000��
//��ͼƥ��ͨ�ò���
#define MINPROB 1e-150 //������ʵ�����

typedef list<GeoPoint*> Traj;


//��ͼƥ���������ݽṹ
struct Score//����ĳ���켣���Ӧ��һ����ѡ·��
{
	Edge* edge;//��ѡ·�ε�ָ��
	long double score;//��ѡ·�������е��������
	int preColumnIndex;//��ѡ·�ε�ǰ��·�ε�������
	double distLeft;//�켣���ͶӰ�㵽��ѡ·�����ľ���
	Score(Edge* edge, long double score, int pre, double distLeft)
	{
		this->edge = edge;
		this->score = score;
		this->preColumnIndex = pre;
		this->distLeft = distLeft;
	}
};

class MapMatcher
{
public:	
	Map* roadNetwork;
	//�����������������̾��룬��pair�Ա�ʾ�����յ㣬ֵpair��ʾ�������̾���Ͷ�Ӧ��deltaT
	//�����deltaT��ԭ���ǣ����deltaT��С���򷵻ص���̾������ΪINF��������������ͬ�����յ㡢��deltaT���ʱ����̾�����ܾͲ���INF��
	//���Ƶģ����ѱ������̾��벻��INF��������ĳ����С��deltaTʱ����̾�����ܾ���INF��
	std::map<pair<int, int>, pair<double, double>> shortestDistPair = std::map<pair<int, int>, pair<double, double>>();

	MapMatcher(Map* roadNetwork);
	void setMap(Map* roadNetwork);
	//MapMatching�ؼ�������trajectoryΪ��Ҫ��ͼƥ��Ĺ켣(һ��)��resultEdgesΪ�ù켣��ÿ���㰴��ƥ���·��ָ�룬ƥ��ʧ�ܵĵ���ƥ���·��ָ��ΪNULL��
	//rangeOfCandidateEdgesΪƥ�䷶Χ�޶������ĳ�������ڸ�ƥ�䷶Χ��û���κ�·�Σ���õ㱻��Ϊƥ��ʧ��
	void MapMatching(list<GeoPoint*> &trajectory, list<Edge*>& resultEdges, int rangeOfCandidateEdges = 5);
private:
	double EmissionProb(double t, double dist);
	int GetStartColumnIndex(vector<Score> &row);
};