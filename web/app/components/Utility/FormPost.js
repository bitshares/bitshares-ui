module.exports = 
{
	SerializeToQuery:function(obj) 
	{
		var str = [];
		for( var p in obj)
		if (obj.hasOwnProperty(p)) 
		{
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
		return str.join("&");
	},		
	PostForm:function(endPoint, jsonObject)
	{
		return fetch( endPoint, 
		{
			method:'post',
			headers: new Headers( { "Accept": "application/json", "Content-Type":"application/x-www-form-urlencoded" } ),
			body: this.SerializeToQuery(jsonObject)
		});
	}
}