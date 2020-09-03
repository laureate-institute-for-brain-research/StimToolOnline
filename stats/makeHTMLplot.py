#!/usr/bin/env python

# Generate the HTML output data for the completed page

import os
import glob
import sys
import csv
import fnmatch, re

from collections import OrderedDict

subject = sys.argv[1]


outpuTable = open( subject + 'DPTable.csv','w+')


def toList(file1):
	data = []
	with open(file1, 'rU') as fin:
		reader = csv.reader(fin)
		for row in reader:
			data.append(row[0:])
	return data


def getDictOfTrial(filenameList):
	userTrials = {}
	for row in filenameList[2:]:
		trial_number = int(row[0])
		trial_event = row[2]
		trial_rt = float(row[4])
		if trial_event == '7':
			userTrials[trial_number] = trial_rt

	return userTrials
# 
listDPFILES = glob.glob('../task/data/DP-*.csv')


TrialCount = {}
Trials = {}


userTrialsT1 = {}
userTrialsT2 = {}

otherTrialsT1 = {}
otherTrialsT1counts = {}

otherTrialsT2 = {}
otherTrialsT2counts = {}

# Turn Single into Dictionary
for file in glob.glob('../task/data/DP-' + subject + '-T1*.csv'):
	# Reads the 1st match
	#print file
	userTrialsT1 = getDictOfTrial(toList(file))
	break
# Turn Single into Dictionary
for file in glob.glob('../task/data/DP-' + subject + '-T2*.csv'):
	# Reads the 1st match
	#print file
	userTrialsT2 = getDictOfTrial(toList(file))
	break


#print 'trial_number,group,session,rt'
outpuTable.write('trial_number,group,session,rt\n')
for file  in listDPFILES:
	
	if '-T1-' in file:
		content1File = toList(file)

		for row in content1File[2:]:
			trial_number = int(row[0])
			trial_event = row[2]
			trial_rt = row[4]

			if trial_event == '7':


				if trial_number in Trials:
					otherTrialsT1counts[trial_number] = otherTrialsT1counts[trial_number] + 1
					otherTrialsT1[trial_number] = otherTrialsT1[trial_number] + float(trial_rt)
				else:
					otherTrialsT1counts[trial_number] = 1
					otherTrialsT1[trial_number] = float(trial_rt)

	if '-T2-' in file:
		#print file
		content2File = toList(file)
		for row in content2File[2:]:
			trial_num = int(row[0])
			trial_event = row[2]
			trial_rt = row[4]

			if trial_event == '7':
				#print trial_num, trial_event, trial_rt
				if trial_num in Trials:
					otherTrialsT2counts[trial_num] = otherTrialsT2counts[trial_num] + 1
					otherTrialsT2[trial_num] = otherTrialsT2[trial_num] + float(trial_rt)
				else:
					otherTrialsT2counts[trial_num] = 1
					otherTrialsT2[trial_num] = float(trial_rt)

				#print trial_number, ,trial_rt
				
for trialNum,RT in sorted(userTrialsT1.items(), key=lambda t: t[0]):
	#print('%s,%s,%s,%s' % (trialNum,'you','Session 1',RT))
	outpuTable.write('%s,%s,%s,%s\n' % (trialNum,'you','Session 1',RT))

for trialNum,RT in sorted(userTrialsT2.items(), key=lambda t: t[0]):
	#print('%s,%s,%s,%s' % (trialNum,'you','Session 2',RT))
	outpuTable.write('%s,%s,%s,%s\n' % (trialNum,'you','Session 2',RT))

for trialNum,RT in sorted(otherTrialsT1.items(), key=lambda t: t[0]):
	avgRT = RT / otherTrialsT1counts[trialNum]
	#print('%s,%s,%s,%s' % (trialNum,'others','Session 1',avgRT))
	outpuTable.write('%s,%s,%s,%s\n' % (trialNum,'others (averages)','Session 1',avgRT))

for trialNum,RT in sorted(otherTrialsT2.items(), key=lambda t: t[0]):
	avgRT = RT / otherTrialsT2counts[trialNum]
	#print('%s,%s,%s,%s' % (trialNum,'others (averages)','Session 2',avgRT))
	outpuTable.write('%s,%s,%s,%s\n' % (trialNum,'others (averages)','Session 2',avgRT))


outpuTable.close()

# print userTrialsT2




