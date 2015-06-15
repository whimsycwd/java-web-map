#!/bin/sh


echo "Start Processing Data"


: '
FILES_STRING=`find ../../BeijingMap/Trajectory -name *.path`

echo $FILES_STRING

IFS=' '
read -a array <<< "a b c d"
echo "${#array[@]}"

for element in "${array[@]}"
do
    echo "$element"
done
'


make compile
for i in $(find ../../frontend/BeijingMap/Trajectory/ -name *.path); do
    ./Main $i
done
