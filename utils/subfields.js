exports.subfields = function(object, propertyList){
	var subfields = {};

	for (var property in object){
		//the property is contained in designated propertyList
		if (propertyList.indexOf(property) != -1){
			//copy this field
			subfields[property] = object[property];
		}
	}

	return subfields;
}

exports.excludeSubfields = function(object, propertyList){
	var subfields = {};

	for (var property in object){
		if (propertyList.indexOf(property) === -1){
			subfields[property] = object[property];
		}
	}

	return subfields;
}
