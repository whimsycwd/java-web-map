/* 
 * Last Updated at [2014/9/1 12:33] by wuhao
 */
#include "MapMatching.h"

MapMatcher::MapMatcher(Map* roadNetwork)
{
	this->roadNetwork = roadNetwork;
}

void MapMatcher::setMap(Map* roadNetwork)
{
	this->roadNetwork = roadNetwork;
}

double MapMatcher::EmissionProb(double t, double dist)
{
	//////////////////////////////////////////////////////////////////////////
	///������ʼ��㺯��
	///������ʣ�ʹ�ù켣�㵽��ѡ·�εľ����ڸ�˹�ֲ��ϵĸ���
	///����t��ΪWang Yin�㷨���裬��ʾǰ��켣����ʱ���
	///����dist���켣�㵽��ѡ·�εľ���
	//////////////////////////////////////////////////////////////////////////
	
	return t*sqrt(dist);
	//return t*sqrt(dist)*COEFFICIENT_FOR_EMISSIONPROB;
}

int MapMatcher::GetStartColumnIndex(vector<Score> &row)
{
	//////////////////////////////////////////////////////////////////////////
	///��������������������������scoreMatrix�и���������������ĺ�ѡ·�ε�����
	//////////////////////////////////////////////////////////////////////////
	
	int resultIndex = -1;
	long double currentMaxProb = 1e10;
	for (size_t i = 0; i < row.size(); i++)
	{
		if (currentMaxProb > row.at(i).score)
		{
			currentMaxProb = row.at(i).score;
			resultIndex = i;
		}
	}
	return resultIndex;
}

void MapMatcher::MapMatching(list<GeoPoint*> &trajectory, list<Edge*>& resultEdges, int rangeOfCandidateEdges)
{
	resultEdges.clear();
	vector<vector<Score>> scoreMatrix = vector<vector<Score>>();//���й켣��ĸ��ʾ���
	//��Ҫ��ÿ��ѭ������ǰ���µı���
	GeoPoint* formerTrajPoint = NULL;//��һ���켣�㣬����·������ʱ��Ҫ
	bool cutFlag = true;//û��ǰһ�켣���ǰһ�켣��û�д��ĺ�ѡ·��
	int currentTrajPointIndex = 0;//��ǰ�켣�������
	for (list<GeoPoint*>::iterator trajectoryIterator = trajectory.begin(); trajectoryIterator != trajectory.end(); trajectoryIterator++)//����ÿ���켣��
	{
		double deltaT = 1;//��ǰ��켣�����ʱ��delaT��ʾǰ�����켣����ʱ���
		if (formerTrajPoint != NULL){ deltaT = (*trajectoryIterator)->time - formerTrajPoint->time; }
		long double currentMaxProb = 1e10;//��ǰ���������ʣ���ʼֵΪ1e10
		vector<Score> scores = vector<Score>();//��ǰ�켣���Score����
		vector<Edge*> canadidateEdges;//��ѡ·�μ���

		// printf("~~~~~%.2lf %.2lf %d\n",(*trajectoryIterator)->lat, (*trajectoryIterator)->lon, rangeOfCandidateEdges );

		roadNetwork->getNearEdges((*trajectoryIterator)->lat, (*trajectoryIterator)->lon, rangeOfCandidateEdges, canadidateEdges);//���������ָ����Χ�ڵĺ�ѡ·�μ���


		// for (auto edge : canadidateEdges) {
		// 	printf("---%d %d\n", edge->startNodeId, edge->endNodeId);
		// }

		long double *emissionProbs = new long double[canadidateEdges.size()];//������Щ��ѡ·�εķ������
		int currentCanadidateEdgeIndex = 0;//��ǰ��ѡ·�ε�����
		for (auto canadidateEdge : canadidateEdges)
		{
			int preColumnIndex = -1;//���浱ǰ��ѡ·�ε�ǰ��·�ε�������
			double currentDistLeft = 0;//��ǰ�켣���ں�ѡ·���ϵ�ͶӰ���·�����ľ���
			double DistBetweenTrajPointAndEdge = roadNetwork->distMFromTransplantFromSRC((*trajectoryIterator)->lat, (*trajectoryIterator)->lon, canadidateEdge, currentDistLeft);

			// printf("DistanceBetweenTrajPointAndEdge %.6lf %.6lf\n", deltaT,  DistBetweenTrajPointAndEdge);
			//������Щ��ѡ·�εķ������
			emissionProbs[currentCanadidateEdgeIndex] = deltaT*sqrt(DistBetweenTrajPointAndEdge);

			// printf("~~~=== DistBetweenTrajPointAndEdge %.6lf\n", DistBetweenTrajPointAndEdge);

			if (!cutFlag)
			{
				//�����ǰ�����㲻�ǹ켣��һ�����ƥ���жϺ�ĵ�һ���㣬���������ǰ��켣��ƥ��·�ε�ת�Ƹ���
				long double currentMaxProbTmp = 1e10;//��ǰ���ת�Ƹ��ʣ���ʼֵΪ1e10
				int formerCanadidateEdgeIndex = 0;
				for (auto formerCanadidateEdge : scoreMatrix.back())
				{
					double formerDistLeft = formerCanadidateEdge.distLeft;//ǰһ���켣���ں�ѡ·���ϵ�ͶӰ���·�����ľ���
					double formerDistToEnd = formerCanadidateEdge.edge->lengthM - formerDistLeft;//ǰһ���켣���ں�ѡ·���ϵ�ͶӰ���·���յ�ľ���
					double routeNetworkDistBetweenTwoEdges;//��·������ľ���
					double routeNetworkDistBetweenTwoTrajPoints;//���켣���Ӧ��ͶӰ����·������					
					if (canadidateEdge == formerCanadidateEdge.edge)
					{
						//���ǰһƥ��·�κ͵�ǰ��ѡ·����ͬһ·�Σ������߼���������ĲΪ·������
						routeNetworkDistBetweenTwoTrajPoints = fabs(currentDistLeft - formerCanadidateEdge.distLeft);
					}
					else
					{
						pair<int, int> odPair = make_pair(formerCanadidateEdge.edge->endNodeId, canadidateEdge->startNodeId);
						//���������յ����·�Ѿ���������Ҳ���INF
						if (shortestDistPair.find(odPair) != shortestDistPair.end() && shortestDistPair[odPair].first < INF)
						{
							//�����ǰdeltaT�µ��ƶ��������ޱ���̾���Ҫ�󣬵������·�����õ���Ҳ�Ǳ���ľ���ֵ����֮�õ��ľ���INF
							shortestDistPair[odPair].first <= MAXSPEED*deltaT ? routeNetworkDistBetweenTwoEdges = shortestDistPair[odPair].first : routeNetworkDistBetweenTwoEdges = INF;
						}
						else
						{
							if (shortestDistPair.find(odPair) != shortestDistPair.end() && deltaT <= shortestDistPair[odPair].second)
							{//����ĸ��������յ����·�����INF���ҵ�ǰdeltaT���ϴμ������·ʱ���ƶ�ʱ��ҪС��˵����ǰdeltaT�µõ������·��������INF
								routeNetworkDistBetweenTwoEdges = INF;
							}
							else
							{
								//����δ������������յ�����·��������ߵ�ǰdeltaT�ȱ����deltaTҪ�󣬿��ܵõ����������·�������֮����Ҫ���ú����������·
								list<Edge*> shortestPath = list<Edge*>();
								routeNetworkDistBetweenTwoEdges = roadNetwork->shortestPathLength(formerCanadidateEdge.edge->endNodeId, canadidateEdge->startNodeId, currentDistLeft, formerDistToEnd, deltaT);
								shortestDistPair[odPair] = make_pair(routeNetworkDistBetweenTwoEdges, deltaT);
							}
						}
						routeNetworkDistBetweenTwoTrajPoints = routeNetworkDistBetweenTwoEdges + currentDistLeft + formerDistToEnd;
					}
					//double distBetweenTwoTrajPoints = GeoPoint::distM((*trajectoryIterator)->lat, (*trajectoryIterator)->lon, formerTrajPoint->lat, formerTrajPoint->lon);//���켣����ֱ�Ӿ���
					long double transactionProb = (long double)routeNetworkDistBetweenTwoTrajPoints*COEFFICIENT_FOR_TRANSATIONPROB;//ת�Ƹ���
					long double tmpTotalProbForTransaction = formerCanadidateEdge.score + transactionProb;
					if (currentMaxProbTmp > tmpTotalProbForTransaction)
					{
						//������ǰת�Ƹ��ʺ���֪��Сת�Ƹ����н�С�ߣ�����ȡlog��Ե�ʣ�
						currentMaxProbTmp = tmpTotalProbForTransaction;
						preColumnIndex = formerCanadidateEdgeIndex;
					}
					formerCanadidateEdgeIndex++;
				}
				//��ʱ��emissionProbs������Ǻ�ѡ·�εķ�����ʣ�����ת�Ƹ������Ϊ��ѡ·�ε�������ʣ�����ȡlog��Ե�ʣ�
				emissionProbs[currentCanadidateEdgeIndex] += currentMaxProbTmp;
			}
			/*����Ҫ�������������ٶȣ���ֻ��������ʴ���MINPROB�ĺ�ѡ·�η��뵱ǰ�켣���Score�����У���������к�ѡ·�η���Score������*/
			scores.push_back(Score(canadidateEdge, emissionProbs[currentCanadidateEdgeIndex], preColumnIndex, currentDistLeft));


			// printf("=====%.6Lf %d %.6lf\n", emissionProbs[currentCanadidateEdgeIndex], preColumnIndex, currentDistLeft);
			//�õ���ǰ��С������ʣ�����ȡlog��Ե�ʣ����Ա��һ��
			if (currentMaxProb > emissionProbs[currentCanadidateEdgeIndex])
			{
				currentMaxProb = emissionProbs[currentCanadidateEdgeIndex]; 
			}
			currentCanadidateEdgeIndex++;
		}
		delete[]emissionProbs;
		formerTrajPoint = *trajectoryIterator;
		currentTrajPointIndex++;
		//for (int i = 0; i < scores.size(); i++)	{ scores[i].score /= currentMaxProb; }//��һ��		
		scoreMatrix.push_back(scores);//�Ѹù켣���Scores�������scoreMatrix��
		if (scores.size() == 0)
		{//��scores����Ϊ�գ���˵��û��һ�����ĺ�ѡ·�Σ�cutFlag��Ϊtrue�������켣��Ϊ�¹켣����ƥ��
			cutFlag = true;
			formerTrajPoint = NULL;
		}
		else
		{
			cutFlag = false;
		}
	}

	//�õ�ȫ��ƥ��·��
	int startColumnIndex = GetStartColumnIndex(scoreMatrix.back());//�õ����һ���켣�����scoreMatrix��Ӧ���е÷���ߵ�����������ȫ��ƥ��·�����յ�
	for (int i = scoreMatrix.size() - 1; i >= 0; i--)
	{
		if (startColumnIndex != -1)
		{
			resultEdges.push_front(scoreMatrix[i][startColumnIndex].edge);
			startColumnIndex = scoreMatrix[i][startColumnIndex].preColumnIndex;
		}
		else
		{
			resultEdges.push_front(NULL);
			if (i > 0)
			{
				startColumnIndex = GetStartColumnIndex(scoreMatrix[i - 1]);
			}
		}
	}
	//���Դ��룺������յĸ��ʾ��������ĳ���켣������к�ѡ·�ε�������ʾ�Ϊ��Ϊ����С/������ǿ��ܾͲ���������Ҫ��һ�������и��ʵĵõ�����
	//for (int i = 0; i < scoreMatrix.size(); i++){
	//	logOutput << scoreMatrix.at(i).size() << "\t";
	//	for (int j = 0; j < scoreMatrix.at(i).size(); j++){
	//		logOutput << "[" << scoreMatrix.at(i).at(j).edge->id << "][" << scoreMatrix.at(i).at(j).preColumnIndex << "][" << scoreMatrix.at(i).at(j).score << "]\t";
	//	}
	//	logOutput << endl;
	//}
	//���Խ���

	//return resultEdges;
	//return linkMatchedResult(mapMatchingResult);
}
