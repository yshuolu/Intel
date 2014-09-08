import sys, urllib2, time, urllib
import sign

#url = 'api.yun.com/cell/search'
url = 'api.91yzh.com/cell/search'

access_id = 'cfe711de972384d0717d064b2de23e7e'

access_key = '30c785bc281b810d38def2f475c9bd6a'

def cell(mnc, lac, cell):
	mnc = str(mnc)
	lac = str(lac)
	cell = str(cell)

	timestamp = str(int(time.time()))

	#build param string
	#collect all params: lac cell timestamp access_id
	paramTupleList = []

	paramTupleList.append(('mnc', mnc));
	paramTupleList.append(('lac', lac))
	paramTupleList.append(('cell', cell))
	paramTupleList.append(('access_id', access_id))
	paramTupleList.append(('timestamp', timestamp))

	#sign
	signature = sign.sign(url, paramTupleList, access_key)

	#paramString
	paramString = ''

	for tupleItem in paramTupleList:
		paramString += tupleItem[0] + '=' + tupleItem[1] + '&'

	#compose valid request url
	requestURL = 'http://' + url + '?' + paramString + 'signature=' + urllib.quote_plus(signature)

	print requestURL

	result = urllib2.urlopen(requestURL).read()

	return result
